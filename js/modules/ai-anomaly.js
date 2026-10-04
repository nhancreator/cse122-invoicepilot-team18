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
        // Lấy danh sách hóa đơn mới nhất từ kho lưu trữ chung qua InvoiceAPI
        const invoices = window.InvoiceAPI ? window.InvoiceAPI.getCollection('invoices') : [];
        
        // Tự động kích hoạt AI-Anomaly Engine quét và hiển thị báo cáo lên container trên trang admin
        if (window.AIAnomalyScanner) {
            window.AIAnomalyScanner.renderReport('anomalyReportContainer', invoices);
        }

        // Cập nhật thống kê tổng quan trên trang quản trị nếu có
        updateAdminStats(invoices);
    }

    function updateAdminStats(invoices) {
        const totalCountEl = document.getElementById('adminTotalInvoices');
        if (totalCountEl) {
            totalCountEl.innerText = invoices.length;
        }
    }

    // Đăng ký lắng nghe sự kiện đồng bộ từ các tab/module khác
    window.addEventListener('storage', (event) => {
        if (event.key === 'invoicepilot_data' || event.key === 'invoicepilot_settings') {
            loadData();
        }
    });

    window.addEventListener('invoicepilot_data_changed', () => {
        loadData();
    });

    window.addEventListener('focus', () => {
        loadData();
    });


    // --- MODULE AI-ANOMALY: QUÉT LỖI BẤT THƯỜNG HÓA ĐƠN ---
    const AIAnomalyScanner = {
        // Ngưỡng định mức mặc định nếu không lấy được từ cấu hình LocalStorage
        getDefaultThreshold() {
            try {
                const settings = JSON.parse(localStorage.getItem('invoicepilot_settings'));
                return settings && settings.threshold ? parseFloat(settings.threshold) : 100000000;
            } catch (e) {
                return 100000000;
            }
        },

        /**
         * Quét danh sách hóa đơn truyền vào và trả về danh sách các bất thường kèm giải thích
         * @param {Array} invoices - Danh sách đối tượng hóa đơn cần kiểm tra
         * @returns {Array} Danh sách kết quả quét bất thường
         */
        scan(invoices = []) {
            const threshold = this.getDefaultThreshold();
            const anomalies = [];

            invoices.forEach((inv) => {
                const issues = [];

                // Kiểm tra thiếu hoặc mã số thuế không hợp lệ
                if (!inv.taxCode || inv.taxCode.trim() === '' || inv.taxCode.length < 10) {
                    issues.push({
                        type: 'MISSING_TAX_CODE',
                        level: 'High',
                        message: 'Thiếu mã số thuế hoặc mã số thuế không đạt chuẩn định dạng (dưới 10 ký tự).'
                    });
                }

                // Kiểm tra số tiền lớn vượt định mức cấu hình
                const amount = parseFloat(inv.amount || 0);
                if (amount > threshold) {
                    issues.push({
                        type: 'EXCEED_THRESHOLD',
                        level: 'Medium',
                        message: `Giá trị hóa đơn (${amount.toLocaleString('vi-VN')} VNĐ) vượt ngưỡng kiểm soát an toàn (${threshold.toLocaleString('vi-VN')} VNĐ).`
                    });
                }

                // Kiểm tra tính hợp lệ của ngày tháng (nếu có)
                if (inv.issueDate && inv.dueDate) {
                    const issueDate = new Date(inv.issueDate);
                    const dueDate = new Date(inv.dueDate);
                    if (dueDate < issueDate) {
                        issues.push({
                            type: 'INVALID_DATE_LOGIC',
                            level: 'High',
                            message: 'Hạn thanh toán sớm hơn ngày phát hành hóa đơn, sai logic thời gian.'
                        });
                    }
                }

                if (issues.length > 0) {
                    anomalies.push({
                        invoiceId: inv.id || inv.code || 'UNKNOWN',
                        customerName: inv.customerName || 'Khách hàng không xác định',
                        amount: amount,
                        issues: issues,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            return anomalies;
        },

        /**
         * Hiển thị báo cáo kết quả quét lên một vùng chứa (container) HTML chỉ định
         * @param {String} containerId - ID của phần tử HTML nhận kết quả
         * @param {Array} invoices - Danh sách hóa đơn kiểm tra
         */
        renderReport(containerId, invoices) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const results = this.scan(invoices);

            if (results.length === 0) {
                container.innerHTML = `
                    <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: var(--success-color); font-size: 0.85rem; display: flex; align-items: center; gap: 10px;">
                        <i class='bx bx-check-shield' style="font-size: 1.2rem;"></i>
                        <span>AI-Anomaly Engine không phát hiện bất thường nào trong các hóa đơn hiện tại. Dữ liệu hoàn toàn an toàn!</span>
                    </div>
                `;
                return;
            }

            let html = `
                <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #f87171; font-weight: 600;">
                        <i class='bx bx-error-circle' style="font-size: 1.2rem;"></i>
                        <span>Phát hiện ${results.length} hóa đơn có dấu hiệu rủi ro / bất thường cần xử lý:</span>
                    </div>
            `;

            results.forEach(res => {
                html += `
                    <div style="background: #060913; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                            <strong>HĐ: ${res.invoiceId} (${res.customerName})</strong>
                            <span style="color: #f87171; font-weight: 600;">${res.amount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <ul style="margin: 0; padding-left: 18px; font-size: 0.75rem; color: var(--text-secondary);">
                `;
                res.issues.forEach(issue => {
                    html += `<li style="margin-bottom: 4px;"><strong style="color: ${issue.level === 'High' ? '#f87171' : 'var(--warning-color)'};">[${issue.level} Risk]</strong> ${issue.message}</li>`;
                });
                html += `</ul></div>`;
            });

            html += `</div>`;
            container.innerHTML = html;
        }
    };

    // Gắn kết vào cửa sổ toàn cục để dễ gọi từ các tệp trang khác nhau
    window.AIAnomalyScanner = AIAnomalyScanner;


    // --- XỬ LÝ FORM CẤU HÌNH HỆ THỐNG (SETTINGS) ---
    const settingsForm = document.getElementById('settingsForm');
    const thresholdInput = document.getElementById('thresholdInput');

    if (thresholdInput) {
        thresholdInput.value = AIAnomalyScanner.getDefaultThreshold();
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newThreshold = thresholdInput ? parseFloat(thresholdInput.value) || 100000000 : 100000000;
            
            const settings = {
                threshold: newThreshold,
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem('invoicepilot_settings', JSON.stringify(settings));
            showToast('Đã lưu cấu hình ngưỡng an toàn thành công!', 'success');
            
            // Chạy lại tiến trình quét ngay lập tức sau khi thay đổi ngưỡng
            loadData();
        });
    }

    // Khởi chạy dữ liệu lần đầu khi load trang quản trị
    loadData();
});