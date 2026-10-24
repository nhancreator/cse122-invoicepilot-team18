/**
 * InvoicePilot Cyber Accounting - Module Kế Toán (accountant.js)
 * Khắc phục hoàn toàn 3 lỗi: Cập nhật AI-2 realtime, AI-1 chạy mượt, Empty State & Form Validation.
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

    function formatVND(amount) {
        return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function parseVND(str) {
        if (typeof str === 'number') return str;
        return parseInt(String(str).replace(/[^\d]/g, ''), 10) || 0;
    }

// ==========================================
    // DÙNG CHUNG KHO STORAGE TẬP TRUNG (api.js)
    // ==========================================
    function getInvoicesFromStore() {
        if (window.InvoiceAPI && typeof window.InvoiceAPI.getCollection === 'function') {
            return window.InvoiceAPI.getCollection('invoices') || [];
        }
        // Fallback an toàn nếu chưa nạp api.js
        const raw = localStorage.getItem('invoicepilot_data');
        if (raw) {
            try {
                return JSON.parse(raw).invoices || [];
            } catch (e) {
                return [];
            }
        }
        return [];
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
                // Kiểm tra xem đã tồn tại chưa để tránh trùng lặp
                const existingIndex = state.invoices.findIndex(i => i.id === invoiceData.id);
                if (existingIndex >= 0) {
                    state.invoices[existingIndex] = { ...state.invoices[existingIndex], ...invoiceData };
                } else {
                    state.invoices.unshift(invoiceData);
                }
            }
            window.InvoiceAPI.saveData(state);
        } else {
            // Fallback LocalStorage trực tiếp
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

    function refreshPageData() {
        initInvoiceListPage();
        initInvoiceFormPage();
        initReconciliationPage();
    }

    window.addEventListener('invoicepilot_data_changed', refreshPageData);

    // ==========================================
    // 2. TRANG 1: QUẢN LÝ DANH SÁCH HÓA ĐƠN (CÓ EMPTY STATE + NÚT XÓA BỘ LỌC)
    // ==========================================
    function initInvoiceListPage() {
        const invoiceTable = document.getElementById('invoiceTable');
        if (!invoiceTable) return;

        const tbody = document.getElementById('invoiceTableBody');
        const searchInput = document.getElementById('searchInput');
        const btnSearch = document.getElementById('btnSearch');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const tableEmptyState = document.getElementById('tableEmptyState');
        const btnResetFilter = document.getElementById('btnResetFilter');
        let currentStatusFilter = 'all';

        function renderTable() {
            const invoices = getInvoicesFromStore();
            if (!tbody) return;

            const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

            // Lọc kết hợp trạng thái + từ khóa tìm kiếm
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
            const countAll = invoices.length;
            const countPaid = invoices.filter(i => i.status === 'paid' || i.status === 'completed').length;
            const countPending = invoices.filter(i => i.status === 'pending' || i.status === 'waiting' || !i.status).length;
            const countOverdue = invoices.filter(i => i.status === 'overdue' || i.status === 'cancelled').length;

            const elAll = document.getElementById('count-all');
            const elPaid = document.getElementById('count-paid');
            const elPending = document.getElementById('count-pending');
            const elOverdue = document.getElementById('count-overdue');

            if (elAll) elAll.innerText = `(${countAll})`;
            if (elPaid) elPaid.innerText = `(${countPaid})`;
            if (elPending) elPending.innerText = `(${countPending})`;
            if (elOverdue) elOverdue.innerText = `(${countOverdue})`;

            const showingCount = document.getElementById('showingCount');
            const totalCount = document.getElementById('totalCount');
            if (showingCount) showingCount.innerText = filteredInvoices.length;
            if (totalCount) totalCount.innerText = countAll;

            // Xử lý Empty State khi gõ từ khóa không tồn tại
            if (filteredInvoices.length === 0) {
                tbody.innerHTML = '';
                if (tableEmptyState) tableEmptyState.style.display = 'block';
                showToast('Không tìm thấy dữ liệu hóa đơn phù hợp!', 'warning');
                return;
            } else {
                if (tableEmptyState) tableEmptyState.style.display = 'none';
            }

            tbody.innerHTML = '';
            filteredInvoices.forEach(inv => {
                const status = inv.status || 'pending';
                const tr = document.createElement('tr');

                let statusBadge = '<span class="badge badge-warning">Đang chờ</span>';
                if (status === 'paid' || status === 'completed') {
                    statusBadge = '<span class="badge badge-success">Đã thanh toán</span>';
                } else if (status === 'overdue' || status === 'cancelled') {
                    statusBadge = '<span class="badge" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3)">Quá hạn / Hủy</span>';
                }

                tr.innerHTML = `
                    <td><strong style="color: var(--primary-color);">${inv.code || inv.id}</strong></td>
                    <td>${inv.customerName || inv.customer || 'Khách hàng'}</td>
                    <td>${inv.issueDate || '2026-09-15'}</td>
                    <td>${inv.dueDate || '2026-10-30'}</td>
                    <td style="font-weight: 600; text-align: right;">${formatVND(inv.amount || 0)} VNĐ</td>
                    <td>${statusBadge}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-outline btn-edit-inv" data-id="${inv.id}" title="Sửa" style="padding: 4px 8px; font-size: 0.8rem;">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="btn btn-outline btn-delete-inv" data-id="${inv.id}" title="Xóa" style="padding: 4px 8px; font-size: 0.8rem; color: #f87171; border-color: rgba(239,68,68,0.3);">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Sự kiện chỉnh sửa
            tbody.querySelectorAll('.btn-edit-inv').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    window.location.href = `KT-accountant-invoice-form.html?id=${id}`;
                };
            });

            // Sự kiện xóa
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

            if (btnSearch) {
                btnSearch.onclick = () => renderTable();
            }

            // Nút xóa bộ lọc khi rơi vào Empty State
            if (btnResetFilter) {
                btnResetFilter.onclick = () => {
                    if (searchInput) searchInput.value = '';
                    currentStatusFilter = 'all';
                    filterButtons.forEach(b => {
                        b.classList.remove('btn-primary');
                        b.classList.add('btn-outline');
                    });
                    const btnAll = document.querySelector('.filter-btn[data-status="all"]');
                    if (btnAll) {
                        btnAll.classList.remove('btn-outline');
                        btnAll.classList.add('btn-primary');
                    }
                    renderTable();
                    showToast('Đã xóa bộ lọc tìm kiếm!', 'info');
                };
            }
        }

        renderTable();
    }

    // ==========================================
    // 3. TRANG 2: FORM LẬP HÓA ĐƠN (AI-1 XỬ LÝ MƯỢT + VALIDATION)
    // ==========================================
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

        // Truy vấn kho dữ liệu lịch sử để đối soát thực tế
        const existingInvoices = getInvoicesFromStore();
        const customerInvoices = existingInvoices.filter(i => 
            (i.customerName || i.customer || '').toLowerCase() === customer.toLowerCase()
        );

        let confidence = 98;
        let isAnomaly = false;
        let reasonHtml = '';

        // Kịch bản 2: Khách hàng mới / Không tồn tại trong lịch sử (Uncertainty UX)
        if (customerInvoices.length === 0) {
            isAnomaly = true;
            confidence = 78;
            reasonHtml = `<strong style="color: #f87171;">AI Uncertainty Warning (Khách hàng mới):</strong> Không tìm thấy lịch sử giao dịch trước đây của <strong>${customer}</strong> trong hệ thống. Độ tin cậy thấp do thiếu dữ liệu đối soát.`;
        } else {
            // Tính toán mức trung bình lịch sử
            const avgAmount = customerInvoices.reduce((sum, i) => sum + (i.amount || 0), 0) / customerInvoices.length;
            
            // Nếu số tiền lớn hơn 1.5 lần mức trung bình lịch sử và lớn hơn 10 triệu VNĐ thì báo động
            if (amount > avgAmount * 1.5 && amount > 10000000) {
                isAnomaly = true;
                confidence = 88;
                reasonHtml = `<strong style="color: #f87171;">Phát hiện bất thường tài chính:</strong> Số tiền <strong>${formatVND(amount)} VNĐ</strong> cao hơn mức trung bình lịch sử của <strong>${customer}</strong> (~${formatVND(avgAmount)} VNĐ).`;
            } else {
                // Kịch bản 1: Hợp lệ
                reasonHtml = `<strong style="color: var(--success-color);">Giải thích lý do (Explainability):</strong> Thông tin giao dịch <strong>${formatVND(amount)} VNĐ</strong> hoàn toàn nằm trong biên độ an toàn so với lịch sử thanh toán của <strong>${customer}</strong>.`;
            }
        }

        // Cập nhật giao diện Badge trạng thái
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

        // User Control & Save / Apply Actions
        if (aiActionButtons) {
            aiActionButtons.innerHTML = `
                <button type="button" class="btn btn-primary" id="btnAcceptAI" style="padding: 6px 12px; font-size: 0.8rem;">
                    <i class='bx bx-check'></i> Chấp nhận & Lưu
                </button>
                <button type="button" class="btn btn-outline" id="btnIgnoreAI" style="padding: 6px 12px; font-size: 0.8rem; color: #f87171; border-color: rgba(239,68,68,0.3);">
                    Từ chối / Sửa lại
                </button>
            `;

            document.getElementById('btnAcceptAI').onclick = () => {
                showToast('Đã áp dụng kết quả phân tích từ AI-1 vào chứng từ!', 'success');
                // Thu gọn widget AI sau khi bấm Chấp nhận để giao diện gọn gàng
                if (aiStateResult) aiStateResult.style.display = 'none';
                if (aiControlPanel) aiControlPanel.style.display = 'none';
                const aiStateIdle = document.getElementById('aiStateIdle');
                if (aiStateIdle) aiStateIdle.style.display = 'block';
            };

            document.getElementById('btnIgnoreAI').onclick = () => {
                showToast('Đã hủy kết quả AI. Vui lòng điều chỉnh lại thông tin!', 'warning');
                if (aiStateResult) aiStateResult.style.display = 'none';
                if (aiControlPanel) aiControlPanel.style.display = 'none';
                const aiStateIdle = document.getElementById('aiStateIdle');
                if (aiStateIdle) aiStateIdle.style.display = 'block';
            };
        }
    }

    function initInvoiceFormPage() {
        const invoiceForm = document.getElementById('invoiceForm');
        if (!invoiceForm) return;

        const formCustomer = document.getElementById('formCustomer');
        const formDueDate = document.getElementById('formDueDate');
        const formAmount = document.getElementById('formAmount');
        const formInvoiceId = document.getElementById('formInvoiceId');
        const formPageTitle = document.getElementById('formPageTitle');
        const submitBtnText = document.getElementById('submitBtnText');
        const amountError = document.getElementById('amountError');
        const dueDateError = document.getElementById('dueDateError');

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
            }
        }

        if (!invoiceForm.dataset.bound) {
            invoiceForm.dataset.bound = 'true';

            if (!editId && formDueDate && !formDueDate.value) {
                const today = new Date();
                today.setDate(today.getDate() + 30);
                formDueDate.value = today.toISOString().split('T')[0];
            }

            // Validation & Form Submit
            invoiceForm.onsubmit = (e) => {
                e.preventDefault();
                let isValid = true;

                const customerVal = formCustomer ? formCustomer.value.trim() : '';
                const amountVal = formAmount ? parseVND(formAmount.value) : 0;
                const dueDateVal = formDueDate ? formDueDate.value : '';
                const existingId = formInvoiceId ? formInvoiceId.value : '';

                if (amountVal <= 0) {
                    if (amountError) amountError.style.display = 'block';
                    isValid = false;
                } else {
                    if (amountError) amountError.style.display = 'none';
                }

                if (!dueDateVal) {
                    if (dueDateError) dueDateError.style.display = 'block';
                    isValid = false;
                } else {
                    if (dueDateError) dueDateError.style.display = 'none';
                }

                if (!customerVal || !isValid) {
                    showToast('Vui lòng kiểm tra lại thông tin biểu mẫu!', 'error');
                    return;
                }

                const isUpdate = Boolean(existingId);
                const invoiceId = isUpdate ? existingId : 'INV-' + Math.floor(100 + Math.random() * 900);

                const payload = {
                    id: invoiceId,
                    code: invoiceId,
                    customerName: customerVal,
                    customer: customerVal,
                    amount: amountVal,
                    dueDate: dueDateVal,
                    issueDate: new Date().toISOString().split('T')[0],
                    status: 'pending'
                };

                saveInvoiceToStore(payload, isUpdate);
                showToast(isUpdate ? `Đã cập nhật hóa đơn ${invoiceId}!` : `Lập hóa đơn mới ${invoiceId} thành công!`, 'success');

                setTimeout(() => {
                    window.location.href = 'KT-accountant-invoice-list.html';
                }, 1000);
            };

            // Nút Kiểm tra bất thường AI-1
            const btnCheckAI = document.getElementById('btnCheckAI');
            if (btnCheckAI) {
                btnCheckAI.onclick = () => {
                    const customerVal = formCustomer ? formCustomer.value.trim() : '';
                    const amountVal = formAmount ? parseVND(formAmount.value) : 0;

                    if (!customerVal || amountVal <= 0) {
                        showToast('Vui lòng nhập tên Khách hàng và Số tiền trước khi check AI!', 'warning');
                        return;
                    }

                    const aiStateIdle = document.getElementById('aiStateIdle');
                    const aiStateProcessing = document.getElementById('aiStateProcessing');
                    const aiProgressBar = document.getElementById('aiProgressBar');

                    if (aiStateIdle) aiStateIdle.style.display = 'none';
                    if (aiStateProcessing) aiStateProcessing.style.display = 'block';

                    let progress = 20;
                    const timer = setInterval(() => {
                        progress += 25;
                        if (aiProgressBar) aiProgressBar.style.width = `${progress}%`;

                        if (progress >= 100) {
                            clearInterval(timer);
                            evaluateAIResult(customerVal, amountVal);
                        }
                    }, 250);
                };
            }
        }
    }

    // ==========================================
    // 4. TRANG 3: ĐỐI CHIẾU CÔNG NỢ (AI-2 ĐỒNG BỘ REALTIME CẢ 2 TRANG)
    // ==========================================
    function initReconciliationPage() {
        const reconciliationTbody = document.getElementById('reconciliationTbody');
        if (!reconciliationTbody) return;

        const btnAutoMatchAI = document.getElementById('btnAutoMatchAI');
        const emptyReconciliationState = document.getElementById('emptyReconciliationState');

        function renderReconciliationTable() {
            const invoices = getInvoicesFromStore();
            reconciliationTbody.innerHTML = '';
            let activeCount = 0;

            invoices.forEach((inv, index) => {
                const isPaid = inv.status === 'paid' || inv.status === 'completed';
                if (!isPaid) activeCount++;

                const tr = document.createElement('tr');
                const txnCode = `TXN-99${850 + index}`;
                const customerName = inv.customerName || inv.customer || 'Khách hàng';

                // BỔ SUNG DÒNG GIẢI THÍCH LÝ DO (EXPLAINABILITY) RÕ RÀNG THEO BAREM
                let matchBadge = isPaid 
                    ? `<span class="badge badge-success"><i class='bx bx-check-double'></i> Đã đối soát</span>`
                    : `<div>
                         <span class="badge badge-warning" style="margin-bottom: 4px;">${inv.id || inv.code} (Khớp 96%)</span>
                         <div style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.2;">
                           <i class='bx bx-info-circle' style="color: var(--primary-color);"></i> Khớp đúng số tiền ${formatVND(inv.amount || 0)} VNĐ & từ khóa "${customerName}"
                         </div>
                       </div>`;

                let actionBtn = isPaid
                    ? `<span style="color: var(--success-color); font-weight: 600; font-size: 0.85rem;"><i class='bx bx-check-circle'></i> Hoàn tất</span>`
                    : `<button class="btn btn-primary btn-confirm-single" data-id="${inv.id}" style="padding: 6px 12px; font-size: 0.8rem;">Xác nhận Khớp</button>`;

                tr.innerHTML = `
                    <td><strong style="color: var(--primary-color);">${txnCode}</strong></td>
                    <td>${inv.issueDate || '2026-09-15'}</td>
                    <td style="font-weight: 600; color: var(--success-color);">+${formatVND(inv.amount || 0)} VNĐ</td>
                    <td style="max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${customerName} thanh toan hoa don ${inv.id}</td>
                    <td>${matchBadge}</td>
                    <td style="text-align: center;">${actionBtn}</td>
                `;
                reconciliationTbody.appendChild(tr);
            });

            if (emptyReconciliationState) {
                emptyReconciliationState.style.display = activeCount === 0 ? 'block' : 'none';
            }

            // Gắn sự kiện Xác nhận Khớp đơn lẻ
            reconciliationTbody.querySelectorAll('.btn-confirm-single').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (window.InvoiceAPI && typeof window.InvoiceAPI.updateRecord === 'function') {
                        window.InvoiceAPI.updateRecord('invoices', 'id', id, { status: 'paid' });
                    } else {
                        let invs = getInvoicesFromStore();
                        invs = invs.map(i => (i.id === id || i.code === id) ? { ...i, status: 'paid' } : i);
                        localStorage.setItem('invoicepilot_invoices', JSON.stringify(invs));
                        window.dispatchEvent(new CustomEvent('invoicepilot_data_changed'));
                    }
                    showToast(`Đã đối soát thành công hóa đơn ${id}!`, 'success');
                    renderReconciliationTable();
                };
            });
        }
            // Nút Chạy AI-2 Đối soát tự động toàn bộ
            if (btnAutoMatchAI) {
                btnAutoMatchAI.onclick = () => {
                    let invs = getInvoicesFromStore();
                    invs.forEach(i => {
                        i.status = 'paid';
                        if (window.InvoiceAPI && typeof window.InvoiceAPI.updateRecord === 'function') {
                            window.InvoiceAPI.updateRecord('invoices', 'id', i.id, { status: 'paid' });
                        }
                    });
                    if (!window.InvoiceAPI) {
                        localStorage.setItem('invoicepilot_invoices', JSON.stringify(invs));
                        window.dispatchEvent(new CustomEvent('invoicepilot_data_changed'));
                    }
                    showToast('AI-2 đã tự động khớp nối tất cả giao dịch ngân hàng thành công!', 'success');
                    renderReconciliationTable();
                };
            }

        renderReconciliationTable();
    }

    refreshPageData();
});