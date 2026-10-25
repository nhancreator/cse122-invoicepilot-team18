# Báo Cáo Khai Báo Sử Dụng Thuật Toán AI & Automation (AI Usage Report)

---

## 1. Tổng Quan Các Module AI Trong Dự Án
Hệ thống InvoicePilot tích hợp 3 module AI/Automation xử lý thông minh hỗ trợ vận hành nghiệp vụ:

1. **AI Anomaly Check (`js/modules/ai-anomaly.js` & `accountant.js`)**:
   - **Chức năng**: Tự động quét và phát hiện các giao dịch đối soát ngân hàng bất thường (số tiền không khớp lịch sử, rủi ro khách hàng mới)[cite: 60].
   - **Màn hình ứng dụng**: `KT-accountant-invoice-form.html` & `KT-accountant-reconciliation.html`[cite: 60].
   - **Cơ chế triển khai**: Giả lập thuật toán rule-based kết hợp dữ liệu lịch sử trong `LocalStorage`[cite: 61].

2. **AI Smart Reminder (`js/modules/ai-reminder.js`)**:
   - **Chức năng**: Phân tích số ngày quá hạn và giá trị hóa đơn để tự động gợi ý kịch bản và soạn nội dung Email nhắc nợ phù hợp[cite: 60].
   - **Màn hình ứng dụng**: `KD-sales-payment-reminders.html`[cite: 60].

3. **AI Cashflow Forecasting (`js/modules/ai-cashflow.js`)**:
   - **Chức năng**: Dựa trên chu kỳ thanh toán lịch sử của khách hàng để dự báo dòng tiền thực thu trong 30-90 ngày tới[cite: 60].
   - **Màn hình ứng dụng**: `QL-manager-cashflow-forecast.html`[cite: 60].

---

## 2. Nhật Ký Sử Dụng Công Cụ AI & Câu Lệnh Prompt Chính
- **Công cụ AI sử dụng**: ChatGPT / Claude / Gemini / GitHub Copilot[cite: 21].
- **Các câu lệnh (Prompts) chính đã áp dụng**:
  1. `[GHI CÂU LỆNH PROMPT 1 EM ĐÃ DÙNG, VD: Hãy viết hàm JavaScript thuần lọc mảng hóa đơn theo từ khóa và trạng thái thanh toán mà không làm mất dữ liệu gốc]`
  2. `[GHI CÂU LỆNH PROMPT 2 EM ĐÃ DÙNG, VD: Tạo giao diện AI UX 6 bước gồm Loading progress bar, badge rủi ro và 2 nút bấm Chấp nhận / Từ chối]`

---

## 3. Phần Code AI Sinh Ra Bị Lỗi & Cách Sinh Viên Tự Kiểm Chứng/Chỉnh Sửa
* **Lỗi 1 (Hành vi AI)**: AI sinh ra đoạn code render kết quả kiểm tra bất thường (AI-1) dạng chuỗi văn bản đơn giản mà **thiếu hoàn toàn hai nút bấm tương tác "Chấp nhận & Lưu" và "Từ chối / Sửa lại"**, đồng thời không gắn sự kiện lưu dữ liệu[cite: 21, 23, 24].
  - **Cách sinh viên khắc phục**: Tự viết bổ sung lại hàm `evaluateAIResult` trong tệp `accountant.js`, khởi tạo lại phần tử `aiActionButtons.innerHTML` với đầy đủ 2 nút bấm, gắn sự kiện `onclick` hiển thị thông báo `showToast` và cập nhật lại giao diện trạng thái thực sự.
* **Lỗi 2 (Hành vi AI)**: Logic xóa hóa đơn ban đầu AI sinh ra bị lệch tên khóa lưu trữ (`invoicepilot_invoices` thay vì `invoicepilot_data`), làm cho hóa đơn bấm xóa xong bị hiện lại sau khi nhấn F5.
  - **Cách sinh viên khắc phục**: Đã chỉnh sửa lại sự kiện nút Xóa trong `initInvoiceListPage` để đồng bộ đúng vào kho dữ liệu chung `localStorage.getItem('invoicepilot_data')` và gọi phát sự kiện `invoicepilot_data_changed`.

---

## 4. Cam Kết Minh Bạch Thử Nghiệm AI
- **Tính năng gọi API thật vs Mockup**: Hệ thống chạy hoàn toàn dưới dạng Client-side Frontend với dữ liệu giả lập (Mock data / LocalStorage)[cite: 61] để đảm bảo an toàn API Key, an toàn bảo mật và phục vụ demo mượt mà không bị trễ mạng[cite: 19, 20].