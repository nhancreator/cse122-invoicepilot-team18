/**
 * InvoicePilot Cyber Accounting - Module Kế Toán (accountant.js)
 * Quản lý Hóa đơn, Lập/Cập nhật Chứng từ (AI-1) & Đối soát Công nợ (AI-2)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 0. TOAST NOTIFICATION SYSTEM
    // ==========================================
    function showToast(message, type = 'success') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.setAttribute('aria-live', 'polite');
            container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `cyber-toast cyber-toast-${type}`;
        
        const bgColor = type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
                        type === 'warning' ? 'rgba(245, 158, 11, 0.95)' :
                        type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)';

        toast.style.cssText = `
            background: ${bgColor};
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            font-size: 0.85rem;
            font-weight: 600;
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease forwards;
        `;

        const iconClass = type === 'success' ? 'bx-check-circle' :
                          type === 'warning' ? 'bx-error' :
                          type === 'error' ? 'bx-x-circle' : 'bx-info-circle';

        toast.innerHTML = `<i class='bx ${iconClass}' style="font-size: 1.2rem;"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Format tiền tệ Việt Nam (VNĐ)
    function formatVND(amount) {
        return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Parse chuỗi tiền tệ thành số nguyên
    function parseVND(str) {
        if (typeof str === 'number') return str;
        return parseInt(String(str).replace(/[^\d]/g, ''), 10) || 0;
    }

    // ==========================================
    // 1. DỮ LIỆU CHUNG & REALTIME SYNC (Qua InvoiceAPI)
    // ==========================================
    function getInvoicesFromStore() {
        if (window.InvoiceAPI && typeof window.InvoiceAPI.getCollection === 'function') {
            return window.InvoiceAPI.getCollection('invoices') || [];
        }
        const local = localStorage.getItem('invoicepilot_invoices');
        return local ? JSON.parse(local) : [];
    }

    function saveInvoiceToStore(invoiceData, isUpdate = false) {
        if (window.InvoiceAPI && typeof window.InvoiceAPI.addRecord === 'function') {
            if (isUpdate) {
                window.InvoiceAPI.updateRecord('invoices', 'id', invoiceData.id, invoiceData);
            } else {
                window.InvoiceAPI.addRecord('invoices', invoiceData);
                
                // Tự động sinh giao dịch ngân hàng tương ứng cho trang đối chiếu
                let bankTxns = JSON.parse(localStorage.getItem('invoicepilot_bank_txns')) || [];
                const newTxnId = 'TXN-' + Math.floor(99850 + Math.random() * 100);
                bankTxns.push({
                    id: newTxnId,
                    date: invoiceData.issueDate || '01/10/2026',
                    amount: invoiceData.amount,
                    desc: `${invoiceData.customerName || invoiceData.customer} thanh toan hoa don ${invoiceData.id}`,
                    suggestInv: invoiceData.id,
                    confidence: 96,
                    matched: false
                });
                localStorage.setItem('invoicepilot_bank_txns', JSON.stringify(bankTxns));
            }
        } else {
            let invoices = getInvoicesFromStore();
            if (isUpdate) {
                invoices = invoices.map(inv => inv.id === invoiceData.id || inv.code === invoiceData.id ? { ...inv, ...invoiceData } : inv);
            } else {
                invoices.push(invoiceData);

                let bankTxns = JSON.parse(localStorage.getItem('invoicepilot_bank_txns')) || [];
                const newTxnId = 'TXN-' + Math.floor(99850 + Math.random() * 100);
                bankTxns.push({
                    id: newTxnId,
                    date: invoiceData.issueDate || '01/10/2026',
                    amount: invoiceData.amount,
                    desc: `${invoiceData.customerName || invoiceData.customer} thanh toan hoa don ${invoiceData.id}`,
                    suggestInv: invoiceData.id,
                    confidence: 96,
                    matched: false
                });
                localStorage.setItem('invoicepilot_bank_txns', JSON.stringify(bankTxns));
            }
            localStorage.setItem('invoicepilot_invoices', JSON.stringify(invoices));
            window.dispatchEvent(new Event('invoicepilot_data_changed'));
        }
    }

    function refreshPageData() {
        initInvoiceListPage();
        initInvoiceFormPage();
        initReconciliationPage();
    }

    window.addEventListener('invoicepilot_data_changed', refreshPageData);

    // ==========================================
    // 2. MỤC 1: TRANG QUẢN LÝ DANH SÁCH HÓA ĐƠN
    // ==========================================
    function initInvoiceListPage() {
        const invoiceTable = document.getElementById('invoiceTable');
        if (!invoiceTable) return;

        const tbody = invoiceTable.querySelector('tbody');
        const searchInput = document.getElementById('searchInput');
        const filterButtons = document.querySelectorAll('.filter-btn');
        let currentStatusFilter = 'all';

        function updateCounters(allInvoices, filteredInvoices) {
            const countAll = allInvoices.length;
            const countPaid = allInvoices.filter(i => i.status === 'paid' || i.status === 'completed').length;
            const countPending = allInvoices.filter(i => i.status === 'pending' || i.status === 'waiting' || !i.status).length;
            const countOverdue = allInvoices.filter(i => i.status === 'overdue' || i.status === 'cancelled').length;

            const btnAll = document.querySelector('.filter-btn[data-status="all"]');
            const btnPaid = document.querySelector('.filter-btn[data-status="paid"]');
            const btnPending = document.querySelector('.filter-btn[data-status="pending"]');
            const btnOverdue = document.querySelector('.filter-btn[data-status="overdue"]');

            if (btnAll) btnAll.innerText = `Tất cả trạng thái (${countAll})`;
            if (btnPaid) btnPaid.innerText = `Đã thanh toán (${countPaid})`;
            if (btnPending) btnPending.innerText = `Đang chờ (${countPending})`;
            if (btnOverdue) btnOverdue.innerText = `Quá hạn / Hủy (${countOverdue})`;

            const paginationInfo = document.getElementById('paginationInfo') || document.querySelector('.table-footer span, .pagination-info');
            if (paginationInfo) {
                paginationInfo.innerText = `Hiển thị ${filteredInvoices.length} / ${countAll} hóa đơn`;
            }
        }

        function renderTable() {
            const invoices = getInvoicesFromStore();
            if (!tbody) return;

            const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

            const filteredInvoices = invoices.filter(inv => {
                const status = inv.status || 'pending';
                if (currentStatusFilter === 'paid' && !(status === 'paid' || status === 'completed')) return false;
                if (currentStatusFilter === 'pending' && !(status === 'pending' || status === 'waiting' || !inv.status)) return false;
                if (currentStatusFilter === 'overdue' && !(status === 'overdue' || status === 'cancelled')) return false;

                const matchCode = (inv.code || inv.id || '').toLowerCase().includes(keyword);
                const matchCustomer = (inv.customerName || inv.customer || '').toLowerCase().includes(keyword);
                return !keyword || matchCode || matchCustomer;
            });

            updateCounters(invoices, filteredInvoices);

            if (filteredInvoices.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">
                            <i class='bx bx-folder-open' style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                            Không tìm thấy hóa đơn phù hợp.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = '';
            filteredInvoices.forEach(inv => {
                const status = inv.status || 'pending';
                const tr = document.createElement('tr');
                tr.setAttribute('data-status', status);

                let statusBadge = '<span class="badge badge-warning">Chờ thanh toán</span>';
                if (status === 'paid' || status === 'completed') {
                    statusBadge = '<span class="badge badge-success">Đã thanh toán</span>';
                } else if (status === 'overdue' || status === 'cancelled') {
                    statusBadge = '<span class="badge badge-danger">Đã hủy / Quá hạn</span>';
                }

                tr.innerHTML = `
                    <td><strong style="color: var(--primary-color);">${inv.code || inv.id}</strong></td>
                    <td>${inv.customerName || inv.customer || 'Khách hàng'}</td>
                    <td>${inv.issueDate || '2026-09-15'}</td>
                    <td>${inv.dueDate || '2026-10-30'}</td>
                    <td style="font-weight: 600; text-align: right;">${formatVND(inv.amount || 0)} VNĐ</td>
                    <td>${statusBadge}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-outline btn-sm btn-edit-inv" data-id="${inv.id}" title="Chỉnh sửa hóa đơn" style="padding: 4px 8px; font-size: 0.8rem;">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="btn btn-outline btn-sm btn-delete-inv" data-id="${inv.id}" title="Xóa hóa đơn" style="padding: 4px 8px; font-size: 0.8rem; color: #f87171; border-color: rgba(239, 68, 68, 0.3);">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            tbody.querySelectorAll('.btn-edit-inv').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    window.location.href = `KT-accountant-invoice-form.html?id=${id}`;
                };
            });

            tbody.querySelectorAll('.btn-delete-inv').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hóa đơn ${id}?`)) {
                        // 1. Xóa hóa đơn khỏi store
                        if (window.InvoiceAPI && typeof window.InvoiceAPI.deleteRecord === 'function') {
                            window.InvoiceAPI.deleteRecord('invoices', 'id', id);
                        } else {
                            let invoices = getInvoicesFromStore();
                            invoices = invoices.filter(inv => inv.id !== id && inv.code !== id);
                            localStorage.setItem('invoicepilot_invoices', JSON.stringify(invoices));
                        }

                        // 2. Xóa đồng thời giao dịch ngân hàng tương ứng ở trang đối chiếu
                        let bankTxns = JSON.parse(localStorage.getItem('invoicepilot_bank_txns')) || [];
                        bankTxns = bankTxns.filter(t => t.suggestInv !== id);
                        localStorage.setItem('invoicepilot_bank_txns', JSON.stringify(bankTxns));

                        window.dispatchEvent(new Event('invoicepilot_data_changed'));
                        showToast(`Đã xóa hóa đơn ${id} thành công!`, 'error');
                        renderTable();
                    }
                };
            });
        }

        if (!invoiceTable.dataset.bound) {
            invoiceTable.dataset.bound = 'true';
            filterButtons.forEach(btn => {
                btn.onclick = () => {
                    filterButtons.forEach(b => {
                        b.classList.remove('btn-primary');
                        b.classList.add('btn-outline');
                    });
                    btn.classList.remove('btn-outline');
                    btn.classList.add('btn-primary');
                    currentStatusFilter = btn.getAttribute('data-status') || 'all';
                    renderTable();
                };
            });

            if (searchInput) {
                searchInput.oninput = () => renderTable();
            }
        }

        renderTable();
    }

    // ==========================================
    // 3. MỤC 2: TRANG FORM LẬP & CẬP NHẬT HÓA ĐƠN + AI-1
    // ==========================================
    function initInvoiceFormPage() {
        const invoiceForm = document.getElementById('invoiceForm');
        if (!invoiceForm) return;

        const formCustomer = document.getElementById('formCustomer');
        const formDueDate = document.getElementById('formDueDate');
        const formAmount = document.getElementById('formAmount');
        const formInvoiceId = document.getElementById('formInvoiceId');
        const formPageTitle = document.getElementById('formPageTitle');
        const submitBtnText = document.getElementById('submitBtnText');
        const formStatusBadge = document.getElementById('formStatusBadge');

        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('id');

        if (editId && !invoiceForm.dataset.loadedEdit) {
            invoiceForm.dataset.loadedEdit = 'true';
            const invoices = getInvoicesFromStore();
            const existingInv = invoices.find(inv => inv.id === editId || inv.code === editId);

            if (existingInv) {
                if (formInvoiceId) formInvoiceId.value = existingInv.id;
                if (formCustomer) formCustomer.value = existingInv.customerName || existingInv.customer || '';
                if (formAmount) formAmount.value = formatVND(existingInv.amount || 0);
                if (formDueDate) formDueDate.value = existingInv.dueDate || '';
                
                if (formPageTitle) formPageTitle.innerText = `Cập Nhật Hóa Đơn: ${existingInv.code || existingInv.id}`;
                if (submitBtnText) submitBtnText.innerText = 'Cập Nhật Hóa Đơn';
                if (formStatusBadge) {
                    formStatusBadge.className = existingInv.status === 'paid' ? 'badge badge-success' : 'badge badge-warning';
                    formStatusBadge.innerText = existingInv.status === 'paid' ? 'Đã thanh toán' : 'Đang cập nhật';
                }
            }
        }

        if (!invoiceForm.dataset.bound) {
            invoiceForm.dataset.bound = 'true';

            if (!editId && formDueDate && !formDueDate.value) {
                const today = new Date();
                today.setDate(today.getDate() + 30);
                formDueDate.value = today.toISOString().split('T')[0];
            }

            if (formCustomer) {
                formCustomer.oninput = (e) => {
                    const val = e.target.value.trim();
                    if (val === 'Công ty Cổ phần A' && (!formAmount.value || parseVND(formAmount.value) === 0)) {
                        formAmount.value = formatVND(15000000);
                    } else if (val === 'Tập đoàn X' && (!formAmount.value || parseVND(formAmount.value) === 0)) {
                        formAmount.value = formatVND(30000000);
                    }
                };
            }

            if (formAmount) {
                const cleanAmountInput = formAmount.cloneNode(true);
                formAmount.parentNode.replaceChild(cleanAmountInput, formAmount);

                cleanAmountInput.addEventListener('input', (e) => {
                    let raw = e.target.value.replace(/\D/g, '');
                    if (!raw) {
                        e.target.value = '';
                        return;
                    }
                    let cursor = e.target.selectionStart;
                    let oldLen = e.target.value.length;

                    e.target.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

                    let newLen = e.target.value.length;
                    cursor += (newLen - oldLen);
                    try {
                        e.target.setSelectionRange(cursor, cursor);
                    } catch (err) {}
                });
            }

            invoiceForm.onsubmit = (e) => {
                e.preventDefault();
                const activeAmountInput = document.getElementById('formAmount');
                const customerVal = formCustomer ? formCustomer.value : '';
                const amountVal = activeAmountInput ? parseVND(activeAmountInput.value) : 0;
                const dueDateVal = formDueDate ? formDueDate.value : '';
                const existingId = formInvoiceId ? formInvoiceId.value : '';

                if (!customerVal || amountVal <= 0 || !dueDateVal) {
                    showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)', 'error');
                    return;
                }

                const isUpdate = Boolean(existingId);
                const invoiceId = isUpdate ? existingId : 'INV-' + Math.floor(100 + Math.random() * 900);

                const existingInvoices = getInvoicesFromStore();
                const oldInv = existingInvoices.find(i => i.id === invoiceId);
                const currentStatus = oldInv ? (oldInv.status || 'pending') : 'pending';

                const payload = {
                    id: invoiceId,
                    code: invoiceId,
                    customerName: customerVal,
                    customer: customerVal,
                    amount: amountVal,
                    dueDate: dueDateVal,
                    issueDate: oldInv?.issueDate || new Date().toISOString().split('T')[0],
                    status: currentStatus
                };

                saveInvoiceToStore(payload, isUpdate);
                showToast(isUpdate ? `Đã cập nhật hóa đơn ${invoiceId} thành công!` : `Đã lưu hóa đơn mới ${invoiceId} thành công!`, 'success');

                setTimeout(() => {
                    window.location.href = 'KT-accountant-invoice-list.html';
                }, 1200);
            };

            const btnCheckAI = document.getElementById('btnCheckAI');
            if (btnCheckAI) {
                btnCheckAI.onclick = () => {
                    const activeAmountInput = document.getElementById('formAmount');
                    const selectedCustomer = formCustomer ? formCustomer.value : '';
                    const rawAmount = activeAmountInput ? parseVND(activeAmountInput.value) : 0;

                    if (!selectedCustomer) {
                        showToast('Vui lòng chọn Khách hàng trước khi kiểm tra AI!', 'warning');
                        if (formCustomer) formCustomer.focus();
                        return;
                    }
                    if (rawAmount <= 0) {
                        showToast('Vui lòng nhập Số tiền hợp lệ lớn hơn 0 VNĐ!', 'warning');
                        if (activeAmountInput) activeAmountInput.focus();
                        return;
                    }

                    const aiStateIdle = document.getElementById('aiStateIdle');
                    const aiStateProcessing = document.getElementById('aiStateProcessing');
                    const aiStateResult = document.getElementById('aiStateResult');
                    const aiControlPanel = document.getElementById('aiControlPanel');
                    const aiProgressBar = document.getElementById('aiProgressBar');
                    const aiBadgeStatus = document.getElementById('aiBadgeStatus');

                    if (aiStateIdle) aiStateIdle.style.display = 'none';
                    if (aiStateResult) aiStateResult.style.display = 'none';
                    if (aiControlPanel) aiControlPanel.style.display = 'none';
                    if (aiStateProcessing) aiStateProcessing.style.display = 'block';

                    if (aiProgressBar) aiProgressBar.style.width = '20%';
                    if (aiBadgeStatus) {
                        aiBadgeStatus.className = 'badge';
                        aiBadgeStatus.style.background = 'rgba(59,130,246,0.2)';
                        aiBadgeStatus.style.color = '#3b82f6';
                        aiBadgeStatus.innerText = 'ANALYZING...';
                    }

                    let progress = 20;
                    const timer = setInterval(() => {
                        progress += 25;
                        if (aiProgressBar) aiProgressBar.style.width = `${progress}%`;

                        if (progress >= 100) {
                            clearInterval(timer);
                            evaluateAIResult(selectedCustomer, rawAmount);
                        }
                    }, 300);
                };
            }
        }
    }

    // ==========================================
    // 4. MỤC 3: TRANG ĐỐI CHIẾU CÔNG NỢ (AI-2 - TỰ ĐỘNG DỌN DẸP GIAO DỊCH MỒ CÔI)
    // ==========================================
    function initReconciliationPage() {
        const reconciliationTbody = document.getElementById('reconciliationTbody');
        if (!reconciliationTbody) return;

        const btnAutoMatchAI = document.getElementById('btnAutoMatchAI');
        const emptyReconciliationState = document.getElementById('emptyReconciliationState');

        const invoices = getInvoicesFromStore();
        let bankTransactions = JSON.parse(localStorage.getItem('invoicepilot_bank_txns')) || [];

        // 1. Tự động dọn dẹp các giao dịch ngân hàng mồ côi (nếu hóa đơn gốc đã bị xóa)
        const validInvoiceIds = invoices.map(i => i.id);
        bankTransactions = bankTransactions.filter(txn => validInvoiceIds.includes(txn.suggestInv));

        // 2. Tự động quét và bổ sung các hóa đơn mới chưa có giao dịch đối soát
        invoices.forEach(inv => {
            const found = bankTransactions.find(txn => txn.suggestInv === inv.id);
            if (!found) {
                bankTransactions.push({
                    id: 'TXN-' + Math.floor(99850 + Math.random() * 100),
                    date: inv.issueDate || '01/10/2026',
                    amount: inv.amount,
                    desc: `${inv.customerName || inv.customer} thanh toan hoa don ${inv.id}`,
                    suggestInv: inv.id,
                    confidence: 95,
                    matched: inv.status === 'paid' || inv.status === 'completed'
                });
            } else {
                found.amount = inv.amount;
                found.desc = `${inv.customerName || inv.customer} thanh toan hoa don ${inv.id}`;
                if (inv.status === 'paid' || inv.status === 'completed') {
                    found.matched = true;
                }
            }
        });

        localStorage.setItem('invoicepilot_bank_txns', JSON.stringify(bankTransactions));

        function renderReconciliationTable() {
            reconciliationTbody.innerHTML = '';
            let activeCount = 0;

            bankTransactions.forEach(txn => {
                if (!txn.matched) activeCount++;
                const tr = document.createElement('tr');

                let matchStatusBadge = txn.matched 
                    ? `<span class="badge badge-success"><i class='bx bx-check-double'></i> Đã đối soát</span>`
                    : `<span class="badge badge-warning">${txn.suggestInv} (${txn.confidence}%)</span>`;

                let actionButton = txn.matched
                    ? `<span style="color: var(--success-color); font-weight: 600; font-size: 0.85rem;"><i class='bx bx-check-circle'></i> Hoàn tất</span>`
                    : `<button class="btn btn-primary btn-confirm-match" data-txn="${txn.id}" style="padding: 6px 12px; font-size: 0.8rem;">Xác nhận Khớp</button>`;

                tr.innerHTML = `
                    <td><strong style="color: var(--primary-color);">${txn.id}</strong></td>
                    <td>${txn.date}</td>
                    <td style="font-weight: 600; color: var(--success-color);">+${formatVND(txn.amount)} VNĐ</td>
                    <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${txn.desc}</td>
                    <td>${matchStatusBadge}</td>
                    <td style="text-align: center;">${actionButton}</td>
                `;
                reconciliationTbody.appendChild(tr);
            });

            if (emptyReconciliationState) {
                emptyReconciliationState.style.display = activeCount === 0 ? 'block' : 'none';
            }

            reconciliationTbody.querySelectorAll('.btn-confirm-match').forEach(btn => {
                btn.onclick = (e) => {
                    const txnId = e.currentTarget.getAttribute('data-txn');
                    const txn = bankTransactions.find(t => t.id === txnId);
                    
                    if (txn) {
                        txn.matched = true;
                        localStorage.setItem('invoicepilot_bank_txns', JSON.stringify(bankTransactions));
                        
                        if (window.InvoiceAPI && typeof window.InvoiceAPI.updateRecord === 'function') {
                            window.InvoiceAPI.updateRecord('invoices', 'id', txn.suggestInv, { status: 'paid' });
                        } else {
                            let allInvs = getInvoicesFromStore();
                            allInvs = allInvs.map(i => i.id === txn.suggestInv || i.code === txn.suggestInv ? { ...i, status: 'paid' } : i);
                            localStorage.setItem('invoicepilot_invoices', JSON.stringify(allInvs));
                        }

                        showToast(`Đã đối soát giao dịch ${txnId} và chuyển hóa đơn ${txn.suggestInv} sang "Đã thanh toán"!`, 'success');
                        renderReconciliationTable();
                    }
                };
            });
        }

        if (!reconciliationTbody.dataset.bound) {
            reconciliationTbody.dataset.bound = 'true';
            if (btnAutoMatchAI) {
                btnAutoMatchAI.onclick = () => {
                    bankTransactions.forEach(t => t.matched = true);
                    localStorage.setItem('invoicepilot_bank_txns', JSON.stringify(bankTransactions));
                    
                    let allInvs = getInvoicesFromStore();
                    allInvs = allInvs.map(i => ({ ...i, status: 'paid' }));
                    localStorage.setItem('invoicepilot_invoices', JSON.stringify(allInvs));

                    showToast('AI-2 đã tự động khớp nối tất cả giao dịch ngân hàng thành công!', 'success');
                    renderReconciliationTable();
                };
            }
        }

        renderReconciliationTable();
    }

    refreshPageData();
});