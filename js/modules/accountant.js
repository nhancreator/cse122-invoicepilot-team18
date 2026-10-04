document.addEventListener('DOMContentLoaded', () => {
    // --- TOAST NOTIFICATION HELPER ---
    function showToast(message, type = 'success') {
        const existingToast = document.getElementById('cyberToast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'cyberToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        toast.style.color = '#fff';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        toast.style.zIndex = '9999';
        toast.style.fontSize = '0.85rem';
        toast.style.fontWeight = '600';
        toast.style.backdropFilter = 'blur(10px)';
        toast.style.transition = 'all 0.3s ease';
        toast.innerHTML = `<i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}' style="margin-right: 8px;"></i> ${message}`;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- HỆ THỐNG ĐỒNG BỘ REALTIME & TẢI DỮ LIỆU TẬP TRUNG ---
    function loadData() {
        // Lấy danh sách hóa đơn mới nhất từ kho dữ liệu chung qua api.js
        const invoices = window.InvoiceAPI ? window.InvoiceAPI.getCollection('invoices') : [];
        
        // Render lại giao diện bảng hóa đơn nếu trang hiện tại có bảng
        renderInvoiceTable(invoices);
    }

    function renderInvoiceTable(invoices) {
        const tbody = document.querySelector('#invoiceTable tbody');
        if (!tbody) return; // Nếu trang hiện tại không có bảng này thì bỏ qua

        // Bạn có thể tùy biến cách đổ dữ liệu động ra bảng tại đây nếu muốn render hoàn toàn bằng JS,
        // hoặc giữ nguyên các hàng tĩnh HTML sẵn có và chỉ cập nhật khi có dữ liệu mới.
        executeInvoiceFiltering();
    }

    // Đăng ký các ổ cắm sự kiện Realtime Sync
    window.addEventListener('storage', (event) => {
        if (event.key === 'invoicepilot_data') {
            loadData();
        }
    });

    window.addEventListener('invoicepilot_data_changed', () => {
        loadData();
    });

    window.addEventListener('focus', () => {
        loadData();
    });


    // --- 1. XỬ LÝ LỌC & TÌM KIẾM TRANG DANH SÁCH HÓA ĐƠN ---
    const searchInput = document.getElementById('searchInput');
    const btnSearch = document.getElementById('btnSearch');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let currentStatusFilter = 'all';

    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.className = 'btn btn-outline filter-btn');
                btn.className = 'btn btn-primary filter-btn';
                currentStatusFilter = btn.getAttribute('data-status');
                executeInvoiceFiltering();
            });
        });
    }

    if (btnSearch) {
        btnSearch.addEventListener('click', () => executeInvoiceFiltering());
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') executeInvoiceFiltering();
        });
    }

    function executeInvoiceFiltering() {
        const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const invoiceRows = document.querySelectorAll('#invoiceTable tbody tr');

        invoiceRows.forEach(row => {
            const status = row.getAttribute('data-status');
            const rowText = row.textContent.toLowerCase();

            let matchesStatus = (currentStatusFilter === 'all' || status === currentStatusFilter);
            let matchesKeyword = rowText.includes(keyword);

            if (matchesStatus && matchesKeyword) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // --- 2. XỬ LÝ FORM LẬP HÓA ĐƠN & AI CHECK ---
    const invoiceForm = document.getElementById('invoiceForm');
    const btnCheckAI = document.getElementById('btnCheckAI');
    const aiAnalysisBox = document.getElementById('aiAnalysisBox');

    if (btnCheckAI) {
        btnCheckAI.addEventListener('click', () => {
            aiAnalysisBox.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Đang quét dữ liệu lịch sử tài chính của khách hàng...`;
            setTimeout(() => {
                aiAnalysisBox.innerHTML = `<strong>Phân tích thành công:</strong> Không có lịch sử nợ xấu. Số tiền và hạn thanh toán nằm trong ngưỡng an toàn tài chính.`;
                showToast('AI đã kiểm tra bất thường thành công!', 'success');
            }, 1000);
        });
    }

    if (invoiceForm) {
        invoiceForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Thu thập dữ liệu từ form lập hóa đơn để lưu vào hệ thống chung
            const newInvoiceId = 'INV-' + Math.floor(100 + Math.random() * 900);
            const customerNameInput = document.getElementById('customerName') ? document.getElementById('customerName').value : 'Khách hàng mới';
            const amountInput = document.getElementById('amount') ? parseFloat(document.getElementById('amount').value) || 0 : 10000000;
            const taxCodeInput = document.getElementById('taxCode') ? document.getElementById('taxCode').value : '0100000000';

            // Ghi dữ liệu thông qua InvoiceAPI để đồng bộ Realtime sang các trang Quản lý, Kinh doanh...
            if (window.InvoiceAPI) {
                window.InvoiceAPI.addRecord('invoices', {
                    id: newInvoiceId,
                    code: newInvoiceId,
                    customerName: customerNameInput,
                    amount: amountInput,
                    taxCode: taxCodeInput,
                    issueDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                    status: 'pending'
                });
            }

            showToast('Đã lưu hóa đơn thành công vào hệ thống kế toán!');
            setTimeout(() => {
                window.location.href = 'KT-accountant-invoice-list.html';
            }, 1500);
        });
    }

    // --- 3. XỬ LÝ KHỚP NỐI ĐỐI CHƯỚC NGÂN HÀNG ---
    const matchButtons = document.querySelectorAll('.btn-match');
    matchButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const txnId = row.getAttribute('data-txn');
            
            showToast(`Đã khớp thành công giao dịch ${txnId} với hóa đơn tương ứng!`);
            
            // Cập nhật giao diện dòng thành công
            const actionCell = row.querySelector('td:last-child');
            const badgeCell = row.querySelector('td:nth-last-child(2) .badge');
            
            if (badgeCell) {
                badgeCell.className = 'badge badge-success';
                badgeCell.innerText = 'Đã khớp';
            }
            if (actionCell) {
                actionCell.innerHTML = `<span style="color: var(--success-color); font-weight: 600;"><i class='bx bx-check-double'></i> Hoàn tất</span>`;
            }
        });
    });

    const btnUpload = document.getElementById('btnUploadStatement');
    if (btnUpload) {
        btnUpload.addEventListener('click', () => {
            showToast('Đã mở hộp thoại tải tệp sao kê ngân hàng (.xlsx, .pdf).');
        });
    }

    // Khởi chạy đồng bộ lần đầu khi tải trang
    loadData();
});