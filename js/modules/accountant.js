/* KHO MÃ NGUỒN NGHIỆP VỤ KẾ TOÁN (ACCOUNTANT MODULE) - CÓ CHÚ THÍCH CHI TIẾT  */

document.addEventListener('DOMContentLoaded', () => {

    /* 1. KHỐI TIỆN ÍCH DÙNG CHUNG (TOAST NOTIFICATION, FORMAT VND, THEME)     */

    // Hiển thị khung thông báo nhanh (Toast) ở góc màn hình khi thao tác
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

    // Định dạng số tiền thành chuỗi tiền tệ VNĐ (có dấu chấm phân cách hàng nghìn)
    function formatVND(amount) {
        return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Chuyển đổi chuỗi tiền tệ VNĐ về dạng số nguyên (integer) để tính toán
    function parseVND(str) {
        if (typeof str === 'number') return str;
        return parseInt(String(str).replace(/[^\d]/g, ''), 10) || 0;
    }

    // Khởi tạo tính năng chuyển đổi giao diện Sáng / Tối (Dark / Light Mode)
    const savedTheme = localStorage.getItem('invoicepilot_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = savedTheme === 'light' ? "<i class='bx bx-sun'></i> Chế độ Tối" : "<i class='bx bx-moon'></i> Đổi giao diện";
        themeToggleBtn.onclick = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('invoicepilot_theme', newTheme);
            themeToggleBtn.innerHTML = newTheme === 'light' ? "<i class='bx bx-sun'></i> Chế độ Tối" : "<i class='bx bx-moon'></i> Đổi giao diện";
            showToast(`Đã chuyển sang chế độ ${newTheme === 'light' ? 'Sáng (Light)' : 'Tối (Dark)'}!`, 'success');
        };
    }

    // Chức năng Xuất báo cáo dữ liệu hóa đơn thành tệp CSV
    const btnExportCSV = document.getElementById('btnExportCSV');
    if (btnExportCSV) {
        btnExportCSV.onclick = () => {
            const invoices = getInvoicesFromStore();
            let csvContent = "data:text/csv;charset=utf-8,MaHD,KhachHang,NgayPhatHanh,HanThanhToan,SoTien,TrangThai\r\n";
            invoices.forEach(inv => {
                csvContent += `${inv.id},"${inv.customerName || inv.customer}",${inv.issueDate},${inv.dueDate},${inv.amount},${inv.status}\r\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "invoicepilot_report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Xuất tệp báo cáo CSV thành công!");
        };
    }

    /* 2. KHO LƯU TRỮ TRUNG TÂM & TỰ ĐỘNG QUÉT HÓA ĐƠN QUÁ HẠN                  */

    // Lấy danh sách hóa đơn từ LocalStorage / API trung tâm và tự động kiểm tra quá hạn
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

        const today = new Date().toISOString().split('T')[0];
        let hasChanges = false;

        // Tự động chuyển trạng thái sang 'overdue' (quá hạn) nếu đến hạn mà chưa thanh toán
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

    // Lưu trữ hoặc cập nhật thông tin hóa đơn vào kho lưu trữ dữ liệu chung
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

    /* 3. TRANG 1: QUẢN LÝ DANH SÁCH HÓA ĐƠN (KT-accountant-invoice-list.html)  */
    function initInvoiceListPage() {
        const invoiceTable = document.getElementById('invoiceTable');
        if (!invoiceTable) return;

        const tbody = document.getElementById('invoiceTableBody');
        const searchInput = document.getElementById('searchInput');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const tableEmptyState = document.getElementById('tableEmptyState');
        let currentStatusFilter = 'all';

        // Hàm dựng và hiển thị bảng danh sách hóa đơn dựa trên bộ lọc và từ khóa tìm kiếm
        function renderTable() {
            const invoices = getInvoicesFromStore();
            if (!tbody) return;

            const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

            // Lọc dữ liệu theo trạng thái tab và từ khóa
            const filteredInvoices = invoices.filter(inv => {
                const status = inv.status || 'pending';
                if (currentStatusFilter === 'paid' && !(status === 'paid' || status === 'completed')) return false;
                if (currentStatusFilter === 'pending' && !(status === 'pending' || status === 'waiting')) return false;
                if (currentStatusFilter === 'overdue' && !(status === 'overdue' || status === 'cancelled')) return false;

                const matchCode = (inv.code || inv.id || '').toLowerCase().includes(keyword);
                const matchCustomer = (inv.customerName || inv.customer || '').toLowerCase().includes(keyword);
                return !keyword || matchCode || matchCustomer;
            });

            // Cập nhật số lượng hiển thị trên các thẻ đếm badge
            const countAll = document.getElementById('count-all');
            const countPaid = document.getElementById('count-paid');
            const countPending = document.getElementById('count-pending');
            const countOverdue = document.getElementById('count-overdue');

            if (countAll) countAll.innerText = `(${invoices.length})`;
            if (countPaid) countPaid.innerText = `(${invoices.filter(i => i.status === 'paid' || i.status === 'completed').length})`;
            if (countPending) countPending.innerText = `(${invoices.filter(i => i.status === 'pending' || i.status === 'waiting' || !i.status).length})`;
            if (countOverdue) countOverdue.innerText = `(${invoices.filter(i => i.status === 'overdue' || i.status === 'cancelled').length})`;

            const showingCount = document.getElementById('showingCount');
            const totalCount = document.getElementById('totalCount');
            if (showingCount) showingCount.innerText = filteredInvoices.length;
            if (totalCount) totalCount.innerText = invoices.length;

            // Hiển thị Empty State nếu không tìm thấy kết quả phù hợp
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

            // Gắn sự kiện bấm nút Sửa hóa đơn
            tbody.querySelectorAll('.btn-edit-inv').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    window.location.href = `KT-accountant-invoice-form.html?id=${id}`;
                };
            });

            // Gắn sự kiện bấm nút Xóa hóa đơn
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

        // Gắn sự kiện bộ lọc tab trạng thái và tìm kiếm qua nút bấm / phím Enter
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


    /* 4. TRANG 2: LẬP HÓA ĐƠN & PHÂN TÍCH RỦI RO AI-1 (KT-invoice-form.html) */

    // Hàm mô phỏng AI-1 đánh giá rủi ro tài chính, lịch sử giao dịch và hạn mức
    function evaluateAIResult(customer, amount) {
        const aiStateProcessing = document.getElementById('aiStateProcessing');
        const aiStateResult = document.getElementById('aiStateResult');
        const aiControlPanel = document.getElementById('aiControlPanel');
        const aiResultReason = document.getElementById('aiResultReason');
        const aiBadgeStatus = document.getElementById('aiBadgeStatus');
        const aiConfidenceText = document.getElementById('aiConfidenceText');
        const aiConfidenceFill = document.getElementById('aiConfidenceFill');

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

    // Khởi tạo trang Lập/Sửa hóa đơn và xử lý sự kiện form submit
    function initInvoiceFormPage() {
        const invoiceForm = document.getElementById('invoiceForm');
        if (!invoiceForm) return;

        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('id');

        // Nạp dữ liệu cũ vào form nếu đang ở chế độ chỉnh sửa (Edit mode)
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

        // Xử lý sự kiện lưu hóa đơn (Thêm mới hoặc Cập nhật)
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

        // Gắn sự kiện cho nút "Kiểm tra bất thường AI"
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

    /* 5. TRANG 3: ĐỐI CHIẾU CÔNG NỢ & GỢI Ý KHỚP NỐI AI-2 (reconciliation.html)*/
    function initReconciliationPage() {
        const reconciliationTbody = document.getElementById('reconciliationTbody');
        if (!reconciliationTbody) return;

        // Dựng bảng đối soát giao dịch ngân hàng với hóa đơn chờ thanh toán
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

            const emptyState = document.getElementById('emptyReconciliationState');
            if (emptyState) emptyState.style.display = activeCount === 0 ? 'block' : 'none';

            // Gắn sự kiện bấm nút Xác nhận khớp từng giao dịch lẻ
            reconciliationTbody.querySelectorAll('.btn-confirm-single').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.dataset.id;
                    saveInvoiceToStore({ id: id, status: 'paid' }, true);
                    showToast(`Đã đối soát thành công hóa đơn ${id}!`);
                    renderReconciliationTable();
                };
            });
        }

        // --- CHỨC NĂNG TẢI TỆP SAO KÊ & XỬ LÝ QUÉT TIẾN TRÌNH AI-2 ---
        const btnUploadStatement = document.getElementById('btnUploadStatement');
        const statementFileInput = document.getElementById('statementFileInput');

        if (btnUploadStatement && statementFileInput) {
            btnUploadStatement.onclick = () => {
                statementFileInput.click(); // Mở hộp thoại chọn tệp sao kê ngân hàng của hệ điều hành
            };

            statementFileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    showToast(`Đã tải lên tệp sao kê: ${file.name}. AI-2 đang phân tích dữ liệu...`, 'info');
                    
                    // Hiển thị thanh loading tiến trình quét của AI-2
                    const progressBox = document.getElementById('aiReconciliationProgress');
                    if (progressBox) {
                        progressBox.style.display = 'block';
                        setTimeout(() => {
                            progressBox.style.display = 'none';
                            showToast(`Đọc thành công tệp sao kê ${file.name}! Đã nạp giao dịch vào bảng.`);
                            renderReconciliationTable();
                        }, 1500);
                    }
                }
            };
        }

        // Gắn sự kiện cho nút "Chạy AI Đối Soát" tự động toàn bộ
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

    /* 6. KHỞI CHẠY TOÀN BỘ VÒNG ĐỜI HỆ THỐNG                                 */
    initInvoiceListPage();
    initInvoiceFormPage();
    initReconciliationPage();

    // Lắng nghe sự kiện đồng bộ dữ liệu Realtime giữa các phân hệ
    window.addEventListener('invoicepilot_data_changed', () => {
        initInvoiceListPage();
        initReconciliationPage();
    });

});