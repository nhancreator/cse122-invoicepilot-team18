# Báo Cáo Ứng Dụng Thuật Toán AI / Automation Trong InvoicePilot

---

## 1. Tổng Quan Các Module AI (`js/modules/`)
Hệ thống InvoicePilot tích hợp 3 module AI/Automation xử lý thông minh hỗ trợ vận hành:

1. **AI Anomaly Detection (`js/modules/ai-anomaly.js`)**:
   - **Chức năng**: Tự động quét và phát hiện các giao dịch đối soát ngân hàng bất thường (số tiền không khớp với hóa đơn, lệch Mã nội dung chuyển khoản).
   - **Màn hình ứng dụng**: `KT-accountant-reconciliation.html`.

2. **AI Cashflow Forecasting (`js/modules/ai-cashflow.js`)**:
   - **Chức năng**: Dựa trên chu kỳ thanh toán lịch sử của khách hàng để dự báo dòng tiền thực thu trong 30-90 ngày tới.
   - **Màn hình ứng dụng**: `QL-manager-cashflow-forecast.html`.

3. **AI Smart Reminder (`js/modules/ai-reminder.js`)**:
   - **Chức năng**: Phân tích số ngày quá hạn và giá trị hóa đơn để tự động gợi ý kịch bản và soạn nội dung Email nhắc nợ phù hợp (Lịch sự / Nghiêm túc / Cảnh báo pháp lý).
   - **Màn hình ứng dụng**: `KD-sales-payment-reminders.html`.