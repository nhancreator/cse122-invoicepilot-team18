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
        // Lấy dữ liệu mới nhất từ kho lưu trữ chung qua InvoiceAPI
        const invoices = window.InvoiceAPI ? window.InvoiceAPI.getCollection('invoices') : [];
        
        // Cập nhật lại giao diện hoặc trạng thái bảng quá hạn nếu cần
        filterOverdueTable();
    }

    // Đăng ký lắng nghe sự kiện đồng bộ từ các tab/module khác
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


    // --- 1. XỬ LÝ LỌC VÀ TÌM KIẾM Ở TRANG HÓA ĐƠN QUÁ HẠN ---
    const searchOverdue = document.getElementById('searchOverdue');
    const btnFilterOverdue = document.getElementById('btnFilterOverdue');
    const filterOverdueBtns = document.querySelectorAll('.filter-overdue');
    let selectedRange = 'all';

    if (filterOverdueBtns.length > 0) {
        filterOverdueBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterOverdueBtns.forEach(b => b.className = 'btn btn-outline filter-overdue');
                btn.className = 'btn btn-primary filter-overdue';
                selectedRange = btn.getAttribute('data-range');
                filterOverdueTable();
            });
        });
    }

    if (btnFilterOverdue) {
        btnFilterOverdue.addEventListener('click', () => filterOverdueTable());
    }

    if (searchOverdue) {
        searchOverdue.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') filterOverdueTable();
        });
    }

    function filterOverdueTable() {
        const keyword = searchOverdue ? searchOverdue.value.trim().toLowerCase() : '';
        const overdueRows = document.querySelectorAll('#overdueTable tbody tr');

        overdueRows.forEach(row => {
            const days = parseInt(row.getAttribute('data-days') || '0', 10);
            const rowText = row.textContent.toLowerCase();

            let matchesRange = true;
            if (selectedRange === '30') {
                matchesRange = days <= 30;
            } else if (selectedRange === '60') {
                matchesRange = days > 30;
            }

            const matchesKeyword = rowText.includes(keyword);

            if (matchesRange && matchesKeyword) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }


    // --- 2. XỬ LÝ NÚT GỬI AI NHẮC NỢ TRÊN BẢNG QUÁ HẠN ---
    const reminderButtons = document.querySelectorAll('.btn-action-reminder');
    reminderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showToast('Đã kích hoạt AI-2 gửi email nhắc nợ khẩn cấp thành công!');
        });
    });


    // --- 3. XỬ LÝ TÍNH TOÁN VÀ MÔ PHỎNG AI-3 CASHFLOW FORECAST ---
    const btnRunForecast = document.getElementById('btnRunForecast');
    const forecastPeriod = document.getElementById('forecastPeriod');
    const inflowValue = document.getElementById('inflowValue');
    const outflowValue = document.getElementById('outflowValue');
    const netSurplus = document.getElementById('netSurplus');
    const aiSummaryContent = document.getElementById('aiSummaryContent');

    if (btnRunForecast) {
        btnRunForecast.addEventListener('click', () => {
            const period = forecastPeriod ? forecastPeriod.value : '30';
            
            showToast('Đang chạy lại mô hình dự báo dòng tiền AI-3...');
            setTimeout(() => {
                if (period === '90') {
                    if (inflowValue) inflowValue.innerText = '980.000.000 ₫';
                    if (outflowValue) outflowValue.innerText = '340.000.000 ₫';
                    if (netSurplus) netSurplus.innerText = '+640.000.000 ₫';
                    if (aiSummaryContent) aiSummaryContent.innerHTML = `<strong>Báo cáo AI-3 (90 ngày):</strong> Dự báo dòng tiền quý tới ghi nhận sự tăng trưởng mạnh mẽ (+15%). Khả năng thu hồi công nợ đạt đỉnh vào cuối tháng thứ 2.`;
                } else if (period === '180') {
                    if (inflowValue) inflowValue.innerText = '2.100.000.000 ₫';
                    if (outflowValue) outflowValue.innerText = '780.000.000 ₫';
                    if (netSurplus) netSurplus.innerText = '+1.320.000.000 ₫';
                    if (aiSummaryContent) aiSummaryContent.innerHTML = `<strong>Báo cáo AI-3 (6 tháng):</strong> Tầm nhìn dài hạn cho thấy dòng tiền thặng dư an toàn. Khuyên nghị tái đầu tư 30% thặng dư vào danh mục ngắn hạn.`;
                } else {
                    if (inflowValue) inflowValue.innerText = '350.000.000 ₫';
                    if (outflowValue) outflowValue.innerText = '120.000.000 ₫';
                    if (netSurplus) netSurplus.innerText = '+230.000.000 ₫';
                    if (aiSummaryContent) aiSummaryContent.innerHTML = `<strong>Báo cáo AI-3 (30 ngày):</strong> Dòng tiền ngắn hạn ổn định. Đảm bảo thu hồi đủ công nợ từ Tập đoàn X để cân đối chi phí vận hành.`;
                }
                showToast('Cập nhật dự báo dòng tiền thành công!');
            }, 1000);
        });
    }


    // --- 4. XỬ LÝ XUẤT BÁO CÁO PDF ---
    const btnExport = document.getElementById('btnExportReport');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            showToast('Đang tạo tệp PDF báo cáo tài chính AI-3...');
        });
    }


    // --- 5. XỬ LÝ GIA HẠN TÍN DỤNG ĐỘNG TRÊN DASHBOARD ---
    const extendCreditButtons = document.querySelectorAll('.btn-extend-credit');
    extendCreditButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const invoiceId = e.target.getAttribute('data-id');
            const dueDateSpan = document.getElementById(`dueDate-${invoiceId}`);
            const badgeSpan = document.getElementById(`badge-${invoiceId}`);

            if (dueDateSpan && badgeSpan) {
                // Cập nhật lại thời gian hiển thị trên giao diện
                dueDateSpan.innerText = 'Đã gia hạn (+7 ngày)';
                dueDateSpan.style.color = 'var(--success-color)';

                // Cập nhật trạng thái badge sang an toàn
                badgeSpan.className = 'badge badge-success';
                badgeSpan.innerText = 'Đã gia hạn';

                // Vô hiệu hóa nút sau khi đã gia hạn thành công để tránh bấm nhiều lần
                e.target.innerText = 'Đã gia hạn';
                e.target.disabled = true;
                e.target.style.opacity = '0.6';
                e.target.style.cursor = 'not-allowed';

                // Đồng bộ thay đổi trạng thái sang kho dữ liệu chung qua InvoiceAPI
                if (window.InvoiceAPI) {
                    let invoices = window.InvoiceAPI.getCollection('invoices');
                    let target = invoices.find(inv => inv.id === invoiceId || inv.code === invoiceId);
                    if (target) {
                        target.status = 'extended';
                        window.InvoiceAPI.saveCollection('invoices', invoices);
                    }
                }

                showToast(`Đã gia hạn thành công 7 ngày cho hóa đơn ${invoiceId}!`);
            }
        });
    });

    // Khởi chạy nạp dữ liệu lần đầu khi load trang
    loadData();
});