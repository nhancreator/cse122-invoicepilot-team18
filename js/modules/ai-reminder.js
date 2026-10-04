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
        // Lấy danh sách hóa đơn mới nhất từ api.js để cập nhật danh sách chọn nhắc nợ
        const invoices = window.InvoiceAPI ? window.InvoiceAPI.getCollection('invoices') : [];
        populateInvoiceSelect(invoices);
    }

    function populateInvoiceSelect(invoices) {
        const reminderTargetSelect = document.getElementById('reminderTarget');
        if (!reminderTargetSelect) return;

        const currentValue = reminderTargetSelect.value;

        if (invoices && invoices.length > 0) {
            reminderTargetSelect.innerHTML = invoices.map(inv => 
                `<option value="${inv.id || inv.code}">${inv.id || inv.code} - ${inv.customerName || 'Khách hàng'} (${(inv.amount || 0).toLocaleString()} VNĐ)</option>`
            ).join('');
            
            if (currentValue) {
                reminderTargetSelect.value = currentValue;
            }
        }
    }

    // Đăng ký các ổ cắm sự kiện Realtime Sync giữa các tab/module
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


    // --- 1. XỬ LÝ AI NHẮC NỢ ---
    const btnGenerate = document.getElementById('btnGenerateAI');
    const aiContentArea = document.getElementById('aiContentArea');
    const aiStatusBadge = document.getElementById('aiStatusBadge');
    const aiActionFooter = document.getElementById('aiActionFooter');

    if (btnGenerate) {
        btnGenerate.addEventListener('click', () => {
            const targetInvoice = document.getElementById('reminderTarget') ? document.getElementById('reminderTarget').value : 'INV-001';
            const tone = document.getElementById('reminderTone') ? document.getElementById('reminderTone').value : 'formal';
            const userNote = document.getElementById('reminderNote') ? document.getElementById('reminderNote').value.trim() : '';

            // 1. Trạng thái Đang xử lý (Loading)
            if (aiStatusBadge) {
                aiStatusBadge.className = 'badge badge-warning';
                aiStatusBadge.innerText = 'Đang xử lý AI...';
            }
            if (aiActionFooter) aiActionFooter.style.display = 'none';

            if (aiContentArea) {
                aiContentArea.innerHTML = `
                    <div style="text-align: center; color: var(--text-secondary); padding: 50px 20px;">
                        <i class='bx bx-loader-alt bx-spin' style="font-size: 2.5rem; margin-bottom: 12px; color: var(--primary-color);"></i>
                        <p style="font-size: 0.9rem; margin: 0; color: #fff;">AI đang đọc lịch sử giao dịch và phân tích dữ liệu...</p>
                    </div>
                `;
            }

            setTimeout(() => {
                // 2. Tỷ lệ lỗi ngẫu nhiên mô phỏng lỗi kết nối API (20%)
                const isRandomError = Math.random() < 0.2;

                if (isRandomError) {
                    if (aiStatusBadge) {
                        aiStatusBadge.className = 'badge';
                        aiStatusBadge.style.background = 'rgba(239,68,68,0.15)';
                        aiStatusBadge.style.color = '#f87171';
                        aiStatusBadge.style.border = '1px solid rgba(239,68,68,0.3)';
                        aiStatusBadge.innerText = 'Lỗi hệ thống AI';
                    }

                    if (aiContentArea) {
                        aiContentArea.innerHTML = `
                            <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 16px; text-align: center;">
                                <i class='bx bx-error-circle' style="font-size: 2rem; color: #f87171; margin-bottom: 8px;"></i>
                                <h4 style="margin: 0 0 6px 0; color: #f87171; font-size: 1rem;">Quá tải mô hình phân tích (Error Code: AI-503)</h4>
                                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 12px 0;">Không thể kết nối đến cụm xử lý ngôn ngữ tự nhiên. Vui lòng thử lại.</p>
                                <button class="btn btn-outline" onclick="document.getElementById('btnGenerateAI').click()" style="font-size: 0.8rem; padding: 6px 12px;">Thử lại ngay</button>
                            </div>
                        `;
                    }
                    showToast('Kết nối AI thất bại. Vui lòng thử lại!', 'error');
                    return;
                }

                // 3. Trạng thái thành công
                if (aiStatusBadge) {
                    aiStatusBadge.className = 'badge badge-success';
                    aiStatusBadge.innerText = 'Hoàn thành (Độ tin cậy 98%)';
                }

                let sampleSubject = `[InvoicePilot] Nhắc nhở thanh toán hóa đơn ${targetInvoice}`;
                let sampleBody = `Kính gửi Quý khách hàng,\n\nInvoicePilot xin trân trọng thông báo hóa đơn ${targetInvoice} hiện đang đến hạn thanh toán. Quý công ty vui lòng hoàn tất giao dịch.\n\nTrân trọng,\nBộ phận Kế toán / Kinh doanh.`;

                if (tone === 'urgent') {
                    sampleSubject = `[KHẨN CẤP] Thông báo quá hạn thanh toán hóa đơn ${targetInvoice}`;
                    sampleBody = `Kính gửi Quý khách hàng,\n\nHóa đơn ${targetInvoice} của Quý công ty đã quá hạn thanh toán. Đề nghị thanh toán gấp trong vòng 24 giờ tới.\n\nTrân trọng,\nPhòng Tài chính Doanh nghiệp.`;
                } else if (tone === 'friendly') {
                    sampleSubject = `Nhắc nhở nhẹ nhàng: Hóa đơn ${targetInvoice} sắp tới hạn`;
                    sampleBody = `Chào bạn,\n\nChúng tôi gửi lời nhắc thân thiện về hóa đơn ${targetInvoice} sắp tới hạn thanh toán. Nếu đã chuyển khoản, bạn có thể bỏ qua email này nhé!\n\nChúc bạn một ngày làm việc hiệu quả.`;
                }

                if (aiContentArea) {
                    aiContentArea.innerHTML = `
                        <div style="font-size: 0.85rem; margin-bottom: 12px; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 8px; padding: 10px;">
                            <strong style="color: var(--primary-color);">Lý do AI chọn cấu trúc này:</strong> 
                            <span style="color: var(--text-secondary);">Dựa trên thói quen thanh toán và mức giọng văn (${tone}) đã chọn để tối ưu hóa tỷ lệ thu hồi công nợ.${userNote ? ' Đã kết hợp ghi chú bổ sung.' : ''}</span>
                        </div>
                        
                        <div style="background: #060913; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; font-size: 0.85rem;">
                            <div style="margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                <strong style="color: var(--text-secondary);">Tiêu đề:</strong> <span style="color: #fff;">${sampleSubject}</span>
                            </div>
                            <div>
                                <strong style="color: var(--text-secondary); display: block; margin-bottom: 4px;">Nội dung email:</strong>
                                <div style="white-space: pre-line; color: var(--text-primary); background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; font-family: monospace; font-size: 0.8rem;">${sampleBody}</div>
                            </div>
                        </div>
                    `;
                }

                if (aiActionFooter) aiActionFooter.style.display = 'block';
                showToast('AI đã tạo thành công email nhắc nợ!', 'success');

            }, 1500);
        });
    }

    // Thao tác Chấp nhận / Từ chối / Sửa
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btnAccept' || e.target.closest('#btnAccept')) {
            showToast('Đã chấp nhận nội dung AI và gửi email thành công!');
            if (aiActionFooter) aiActionFooter.style.display = 'none';
            if (aiStatusBadge) {
                aiStatusBadge.className = 'badge badge-success';
                aiStatusBadge.innerText = 'Đã gửi thành công';
            }
        } else if (e.target.id === 'btnReject' || e.target.closest('#btnReject')) {
            if (confirm('Bạn có chắc chắn muốn từ chối kết quả này?')) {
                if (aiContentArea) {
                    aiContentArea.innerHTML = `
                        <div style="text-align: center; color: var(--text-secondary); padding: 60px 20px;">
                            <i class='bx bx-x-circle' style="font-size: 3rem; margin-bottom: 12px; color: #f87171;"></i>
                            <p style="font-size: 0.9rem; margin: 0;">Đã hủy kết quả AI. Bạn có thể cấu hình lại.</p>
                        </div>
                    `;
                }
                if (aiActionFooter) aiActionFooter.style.display = 'none';
                if (aiStatusBadge) {
                    aiStatusBadge.className = 'badge badge-warning';
                    aiStatusBadge.innerText = 'Đã hủy';
                }
                showToast('Đã hủy kết quả AI nhắc nợ.', 'error');
            }
        } else if (e.target.id === 'btnEdit' || e.target.closest('#btnEdit')) {
            showToast('Mở chế độ chỉnh sửa nội dung trực tiếp.', 'success');
        }
    });

    // Khởi chạy nạp dữ liệu lần đầu
    loadData();
});