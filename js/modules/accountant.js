/**
 * InvoicePilot Cyber Accounting - Module Kế Toán (Đã sắp xếp đúng trình tự luồng thao tác)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // BƯỚC 1: KHỞI TẠO TIỆN ÍCH DÙNG CHUNG (TOAST & FORMAT TIỀN TỆ)
    // ==========================================
    function showToast(message, type = 'success') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
                        type === 'warning' ? 'rgba(245, 158, 11, 0.95)' :
                        type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)';

        toast.style.cssText = `background: ${bgColor}; color: #ffffff; padding: 12px 20px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-size: 0.85rem; font-weight: 600;`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function formatVND(amount) {
        return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function parseVND(str) {
        if (typeof str === 'number') return str;
        return parseInt(String(str).replace(/[^\d]/g, ''), 10) || 0;
    }


    // ==========================================
    // BƯỚC 2: KHO LƯU TRỮ TRUNG TÂM & TỰ ĐỘNG QUÉT QUÁ HẠN (OVERDUE)
    // ==========================================
    function getInvoicesFromStore() {
        let invoices = [];
        if (window.InvoiceAPI && typeof window.InvoiceAPI.getCollection === 'function') {
            invoices = window.InvoiceAPI.getCollection('invoices') || [];
        } else {
            const raw = localStorage.getItem('invoicepilot_data');
            if (raw) {
                try { invoices = JSON.parse(raw).invoices || []; } catch (e) { invoices = []; }
            } else {
                invoices = JSON.parse(localStorage.getItem('invoicepilot_invoices') || '[]');
            }
        }

        // Tự động quét: So sánh hạn thanh toán (dueDate) với ngày hiện tại để chuyển sang 'overdue'
        const today = new Date().toISOString().split('T')[0];
        let hasChanges = false;

        invoices = invoices.map(inv => {
            if ((!inv.status || inv.status === 'pending' || inv.status === 'waiting') && inv.dueDate && inv.dueDate < today) {
                inv.status = 'overdue';
                hasChanges = true;
            }
            return inv;
        });

        if (hasChanges) {
            if (window.InvoiceAPI && typeof window.InvoiceAPI.saveCollection === 'function') {
                window.InvoiceAPI.saveCollection('invoices', invoices);
            } else {
                let state = JSON.parse(localStorage.getItem('invoicepilot_data') || '{"invoices":[]}');
                state.invoices = invoices;
                localStorage.setItem('invoicepilot_data', JSON.stringify(state));
            }
        }

        return invoices;
    }

    function saveInvoiceToStore(invoiceData, isUpdate = false) {
        if (window.InvoiceAPI && typeof window.InvoiceAPI.getData === 'function') {
            const state = window.InvoiceAPI.getData();
            if (!state.invoices) state.invoices = [];

            if (isUpdate) {
                state.invoices = state.invoices.map(inv => 
                    (inv.id === invoiceData.id || inv.code === invoiceData.id) ? { ...inv, ...invoiceData } : inv
                );
            } else {
                state.invoices.unshift(invoiceData);
            }
            window.InvoiceAPI.saveData(state);
        } else {
            let state = JSON.parse(localStorage.getItem('invoicepilot_data') || '{"invoices":[]}');
            if (isUpdate) {
                state.invoices = state.invoices.map(inv => (inv.id === invoiceData.id) ? { ...inv, ...invoiceData } : inv);
            } else {
                state.invoices.unshift(invoiceData);
            }
            localStorage.setItem('invoicepilot_data', JSON.stringify(state));
            window.dispatchEvent(new CustomEvent('invoicepilot_data_changed', { detail: state }));
        }
    }


    // ==========================================
    // BƯỚC 3: TRANG 1 - QUẢN LÝ DANH SÁCH HÓA ĐƠN
    // ==========================================
    function initInvoiceListPage() {
        const invoiceTable = document.getElementById('invoiceTable');
        if (!invoiceTable) return;

        const tbody = document.getElementById('invoiceTableBody');
        const searchInput = document.getElementById('searchInput');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const tableEmptyState = document.getElementById('tableEmptyState');
        let currentStatusFilter = 'all';

        function renderTable() {
            const invoices = getInvoicesFromStore();
            if (!tbody) return;

            const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

            const filteredInvoices = invoices.filter(inv => {
                const status = inv.status || 'pending';
                if (currentStatusFilter === 'paid' && !(status === 'paid' || status === 'completed')) return false;
                if (currentStatusFilter === 'pending' && !(status === 'pending' || status === 'waiting')) return false;
                if (currentStatusFilter === 'overdue' && !(status === 'overdue' || status === 'cancelled')) return false;

                const matchCode = (inv.code || inv.id || '').toLowerCase().includes(keyword);
                const matchCustomer = (inv.customerName || inv.customer || '').toLowerCase().includes(keyword);
                return !keyword || matchCode || matchCustomer;
            });

            // Cập nhật số lượng đếm trên Tab
            document.getElementById('count-all').innerText = `(${invoices.length})`;
            document.getElementById('count-paid').innerText = `(${invoices.filter(i => i.status === 'paid' || i.status === 'completed').length})`;
            document.getElementById('count-pending').innerText = `(${invoices.filter(i => i.status === 'pending' || i.status === 'waiting' || !i.status).length})`;
            document.getElementById('count-overdue').innerText = `(${invoices.filter(i => i.status === 'overdue' || i.status === 'cancelled').length})`;

            document.getElementById('showingCount').innerText = filteredInvoices.length;
            document.getElementById('totalCount').innerText = invoices.length;

            if (tableEmptyState) tableEmptyState.style.display = filteredInvoices.length === 0 ? 'block' : 'none';

            tbody.innerHTML = '';
            filteredInvoices.forEach(inv => {
                const status = inv.status || 'pending';
                let statusBadge = '<span class="badge badge-warning">Đang chờ</span>';
                if (status === 'paid' || status === 'completed') {
                    statusBadge = '<span class="badge badge-success">Đã thanh toán</span>';
                } else if (status === 'overdue' || status === 'cancelled') {
                    statusBadge = '<span class="badge" style="background:rgba(239,68,68,0.15); color:#f87171;">Quá hạn</span>';
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${inv.code || inv.id}</strong></td>
                    <td>${inv.customerName || inv.customer || 'Khách hàng'}</td>
                    <td>${inv.issueDate || '2026-09-15'}</td>
                    <td>${inv.dueDate || '2026-10-30'}</td>
                    <td style="font-weight: 600; text-align: right;">${formatVND(inv.amount || 0)} VNĐ</td>
                    <td>${statusBadge}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-outline btn-edit-inv" data-id="${inv.id}" style="padding: 4px 8px;"><i class='bx bx-edit'></i></button>
                        <button class="btn btn-outline btn-delete-inv" data-id="${inv.id}" style="padding: 4px 8px; color: #f87171;"><i class='bx bx-trash'></i></button>
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
                        if (window.InvoiceAPI && typeof window.InvoiceAPI.deleteRecord === 'function') {
                            window.InvoiceAPI.deleteRecord('invoices', 'id', id);
                        } else {
                            let invoices = getInvoicesFromStore();
                            invoices = invoices.filter(inv => inv.id !== id && inv.code !== id);
                            localStorage.setItem('invoicepilot_invoices', JSON.stringify(invoices));
                            window.dispatchEvent(new CustomEvent('invoicepilot_data_changed'));
                        }
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
                    filterButtons.forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-outline'); });
                    btn.classList.remove('btn-outline'); btn.classList.add('btn-primary');
                    currentStatusFilter = btn.getAttribute('data-status') || 'all';
                    renderTable();
                };
            });
            if (searchInput) searchInput.oninput = renderTable;
        }
        renderTable();
    }


    // ==========================================
    // BƯỚC 4: TRANG 2 - FORM LẬP HÓA ĐƠN & CHECK AI-1
    // ==========================================
// --- 4. TRANG 2: LẬP HÓA ĐƠN & CHECK AI-1 ---
    function evaluateAIResult(customer, amount) {
        const aiStateProcessing = document.getElementById('aiStateProcessing');
        const aiStateResult = document.getElementById('aiStateResult');
        const aiControlPanel = document.getElementById('aiControlPanel');
        const aiResultReason = document.getElementById('aiResultReason');
        const aiBadgeStatus = document.getElementById('aiBadgeStatus');
        const aiConfidenceText = document.getElementById('aiConfidenceText');
        const aiConfidenceFill = document.getElementById('aiConfidenceFill');
        const aiActionButtons = document.getElementById('aiActionButtons');

        if (aiStateProcessing) aiStateProcessing.style.display = 'none';
        if (aiStateResult) aiStateResult.style.display = 'block';
        if (aiControlPanel) aiControlPanel.style.display = 'block';

        const existingInvoices = getInvoicesFromStore();
        const customerInvoices = existingInvoices.filter(i => 
            (i.customerName || i.customer || '').toLowerCase() === customer.toLowerCase()
        );

        let confidence = 98;
        let isAnomaly = false;
        let reasonHtml = '';

        if (customerInvoices.length === 0) {
            isAnomaly = true;
            confidence = 78;
            reasonHtml = `<strong style="color: #f87171;">AI Uncertainty Warning (Khách hàng mới):</strong> Không tìm thấy lịch sử giao dịch trước đây của <strong>${customer}</strong> trong hệ thống.`;
        } else {
            const avgAmount = customerInvoices.reduce((sum, i) => sum + (i.amount || 0), 0) / customerInvoices.length;
            
            if (amount > avgAmount * 1.5 && amount > 10000000) {
                isAnomaly = true;
                confidence = 88;
                reasonHtml = `<strong style="color: #f87171;">Phát hiện bất thường tài chính:</strong> Số tiền <strong>${formatVND(amount)} VNĐ</strong> cao hơn mức trung bình lịch sử của <strong>${customer}</strong>.`;
            } else {
                reasonHtml = `<strong style="color: var(--success-color);">Giải thích lý do:</strong> Giao dịch <strong>${formatVND(amount)} VNĐ</strong> nằm trong biên độ an toàn so với lịch sử thanh toán.`;
            }
        }

        if (isAnomaly) {
            if (aiBadgeStatus) {
                aiBadgeStatus.className = 'badge';
                aiBadgeStatus.style.background = 'rgba(239, 68, 68, 0.15)';
                aiBadgeStatus.style.color = '#f87171';
                aiBadgeStatus.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                aiBadgeStatus.innerText = 'CẢNH BÁO RỦI RO';
            }
        } else {
            if (aiBadgeStatus) {
                aiBadgeStatus.className = 'badge badge-success';
                aiBadgeStatus.style.background = 'rgba(16, 185, 129, 0.15)';
                aiBadgeStatus.style.color = '#34d399';
                aiBadgeStatus.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                aiBadgeStatus.innerText = 'AI-1 CHO PHÉP';
            }
        }

        if (aiResultReason) aiResultReason.innerHTML = reasonHtml;
        if (aiConfidenceText) aiConfidenceText.innerText = `${confidence}%`;
        if (aiConfidenceFill) aiConfidenceFill.style.width = `${confidence}%`;

    }

    function initInvoiceFormPage() {
        const invoiceForm = document.getElementById('invoiceForm');
        if (!invoiceForm) return;

        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('id');

        if (editId && !invoiceForm.dataset.loadedEdit) {
            invoiceForm.dataset.loadedEdit = 'true';
            const existingInv = getInvoicesFromStore().find(inv => inv.id === editId || inv.code === editId);
            if (existingInv) {
                document.getElementById('formInvoiceId').value = existingInv.id;
                document.getElementById('formCustomer').value = existingInv.customerName || existingInv.customer || '';
                document.getElementById('formAmount').value = formatVND(existingInv.amount || 0);
                document.getElementById('formDueDate').value = existingInv.dueDate || '';
            }
        }

        invoiceForm.onsubmit = (e) => {
            e.preventDefault();
            const customerVal = document.getElementById('formCustomer').value.trim();
            const amountVal = parseVND(document.getElementById('formAmount').value);
            const dueDateVal = document.getElementById('formDueDate').value;
            const existingId = document.getElementById('formInvoiceId').value;

            if (!customerVal || amountVal <= 0 || !dueDateVal) {
                showToast('Vui lòng điền đúng thông tin!', 'error');
                return;
            }

            const isUpdate = Boolean(existingId);
            const invoiceId = isUpdate ? existingId : 'INV-' + Math.floor(100 + Math.random() * 900);

            saveInvoiceToStore({
                id: invoiceId, code: invoiceId,
                customerName: customerVal, customer: customerVal,
                amount: amountVal, dueDate: dueDateVal,
                issueDate: new Date().toISOString().split('T')[0], status: 'pending'
            }, isUpdate);

            showToast(isUpdate ? 'Cập nhật hóa đơn thành công!' : 'Lập hóa đơn mới thành công!');
            setTimeout(() => { window.location.href = 'KT-accountant-invoice-list.html'; }, 1000);
        };

        const btnCheckAI = document.getElementById('btnCheckAI');
        if (btnCheckAI) {
            btnCheckAI.onclick = () => {
                const customerVal = document.getElementById('formCustomer').value.trim();
                const amountVal = parseVND(document.getElementById('formAmount').value);
                if (!customerVal || amountVal <= 0) {
                    showToast('Nhập tên khách và số tiền trước khi check AI!', 'warning');
                    return;
                }
                document.getElementById('aiStateIdle').style.display = 'none';
                document.getElementById('aiStateProcessing').style.display = 'block';

                setTimeout(() => { evaluateAIResult(customerVal, amountVal); }, 1000);
            };
        }
    }


    // ==========================================
    // BƯỚC 5: TRANG 3 - ĐỐI CHIẾU CÔNG NỢ AI-2
    // ==========================================
    function initReconciliationPage() {
        const reconciliationTbody = document.getElementById('reconciliationTbody');
        if (!reconciliationTbody) return;

        function renderReconciliationTable() {
            const invoices = getInvoicesFromStore();
            reconciliationTbody.innerHTML = '';
            let activeCount = 0;

            invoices.forEach((inv, index) => {
                const isPaid = inv.status === 'paid' || inv.status === 'completed';
                if (!isPaid) activeCount++;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>TXN-99${850 + index}</strong></td>
                    <td>${inv.issueDate || '2026-09-15'}</td>
                    <td style="font-weight: 600; color: #10b981;">+${formatVND(inv.amount || 0)} VNĐ</td>
                    <td>${inv.customerName || inv.customer} thanh toan hoa don ${inv.id}</td>
                    <td>${isPaid ? '<span class="badge badge-success">Đã đối soát</span>' : `<span class="badge badge-warning">${inv.id} (Khớp 96%)</span>`}</td>
                    <td style="text-align: center;">${isPaid ? 'Hoàn tất' : `<button class="btn btn-primary btn-confirm-single" data-id="${inv.id}" style="padding: 4px 10px; font-size: 0.75rem;">Xác nhận</button>`}</td>
                `;
                reconciliationTbody.appendChild(tr);
            });

            document.getElementById('emptyReconciliationState').style.display = activeCount === 0 ? 'block' : 'none';

            reconciliationTbody.querySelectorAll('.btn-confirm-single').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.dataset.id;
                    saveInvoiceToStore({ id: id, status: 'paid' }, true);
                    showToast(`Đã đối soát thành công hóa đơn ${id}!`);
                    renderReconciliationTable();
                };
            });
        }

        const btnAutoMatchAI = document.getElementById('btnAutoMatchAI');
        if (btnAutoMatchAI) {
            btnAutoMatchAI.onclick = () => {
                getInvoicesFromStore().forEach(i => saveInvoiceToStore({ id: i.id, status: 'paid' }, true));
                showToast('AI-2 đã tự động khớp toàn bộ giao dịch!');
                renderReconciliationTable();
            };
        }
        renderReconciliationTable();
    }


    // ==========================================
    // BƯỚC 6: ĐIỂM KHỞI CHẠY HỆ THỐNG (INITIALIZATION)
    // ==========================================
    initInvoiceListPage();
    initInvoiceFormPage();
    initReconciliationPage();

    window.addEventListener('invoicepilot_data_changed', () => {
        initInvoiceListPage();
        initReconciliationPage();
    });

});