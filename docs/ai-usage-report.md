# BÁO CÁO CHI TIẾT KHAI BÁO SỬ DỤNG THUẬT TOÁN AI & AUTOMATION (AI USAGE REPORT)

**Dự án**: InvoicePilot - Hệ thống Quản lý Hóa đơn & Phát hiện Bất thường Tài chính

**Môn học**: CSE122 (Đại học Thủy Lợi - Lớp 67CNTT1)

**Nhóm phát triển**: Nhóm 18 (Đỗ Duy Nhân,Trần Khôi Nguyên, Đàm Minh Quân)

---

## 1. TỔNG QUAN KIẾN TRÚC & CÁC MODULE AI TRONG HỆ THỐNG

Hệ thống được chia thành 3 phân hệ độc lập nhưng đồng bộ dữ liệu thông suốt qua tầng lưu trữ trung tâm `LocalStorage`:

1. **Phân hệ Kế toán (Accounting Workspace - KT)**:
* *Màn hình*: `KT-accountant-invoice-list.html`, `KT-accountant-invoice-form.html`, `KT-accountant-reconciliation.html`.
* *Module tích hợp*: `accountant.js`.
* *Tính năng AI*: **AI Anomaly Check (AI-1)** tự động quét lịch sử giao dịch để phát hiện bất thường về giá trị hoặc khách hàng mới; **AI Reconciliation (AI-2)** tự động khớp lệnh giao dịch ngân hàng với hóa đơn.


2. **Phân hệ Kinh doanh (Sales Workspace - KD)**:
* *Màn hình*: `KD-sales-customer-balance.html`, `KD-sales-payment-reminders.html`.
* *Module tích hợp*: `ai-reminder.js`.
* *Tính năng AI*: **AI Smart Reminder** phân tích mức độ quá hạn và giá trị nợ để soạn thảo email nhắc nợ tự động theo 3 phong cách (Lịch sự, Khẩn cấp, Thân thiện), hỗ trợ chỉnh sửa thủ công và theo dõi số lượng email đã gửi.


3. **Phân hệ Quản lý & Kiểm soát Rủi ro (Management & Risk Control - QL)**:
* *Màn hình*: `QL-manager-receivable-dashboard.html`, `QL-manager-overdue-invoices.html`, `QL-manager-cashflow-forecast.html`.
* *Module tích hợp*: `ai-cashflow.js`.
* *Tính năng AI & Automation*:
* Tính toán điểm sức khỏe tín dụng động (`healthScoreValue`).
* Quản lý hóa đơn quá hạn với bộ lọc thông minh và tính năng **Gia hạn tín dụng (+1 tháng)** đồng bộ real-time sang KT và KD.
* **AI-3 Cashflow Forecasting**: Dự báo dòng tiền thu - chi theo kỳ hạn (30, 90, 180 ngày).


## 2. NHẬT KÝ 3 TUẦN PHÁT TRIỂN & CÁC CÂU LỆNH PROMPT CHÍNH ĐÃ ÁP DỤNG
Công cụ AI sử dụng: `Gemini` , `Chat GPT`
* **Tuần 1 (Khởi tạo & Kiến trúc)**:
> *"Hãy thiết kế cấu trúc thư mục và mô hình dữ liệu tập trung sử dụng LocalStorage kết hợp CustomEvent (`invoicepilot_data_changed`) để đảm bảo khi thao tác ở phân hệ Kế toán thì phân hệ Quản lý và Kinh doanh tự động cập nhật real-time mà không cần tải lại trang."*


* **Tuần 2 (Xử lý nghiệp vụ AI & Thời gian thực)**:
> *"Viết hàm tính toán số ngày quá hạn bám sát thời gian thực (tính từ mốc hạn 30/09/2026 đến hiện tại 25/10/2026), đồng thời xây dựng cơ chế gia hạn tín dụng cộng thêm 1 tháng, tự động đổi trạng thái hóa đơn về pending để loại bỏ khỏi danh sách quá hạn một cách an toàn."*


* **Tuần 3 (Tối ưu Tìm kiếm & Đồng bộ UI)**:
> *"Sửa lại module `ai-cashflow.js` sao cho tính năng tìm kiếm hóa đơn quá hạn hoạt động mượt mà, chính xác y hệt như logic tìm kiếm bên module Kế toán (`accountant.js`) — cho phép gõ ký tự bất kỳ (như chữ 'v' hoặc 'Vanguard') vào ô `#searchOverdue` là lọc ra đúng mã hóa đơn hoặc tên khách hàng ngay lập tức khi đang gõ phím."*


## 3. CÁC LỖI KỸ THUẬT HÓC BÚA ĐÃ GẶP VÀ CÁCH KHẮC PHỤC THỰC TẾ

* **Lỗi 1: Lệch trạng thái hóa đơn sau khi gia hạn tín dụng**
* *Biểu hiện*: Khi bấm "Gia hạn tín dụng" ở phân hệ Quản lý, hạn mới được đẩy lên tháng 12/2026 nhưng hóa đơn vẫn bị kẹt ở bảng Hóa đơn quá hạn và không đồng bộ sang Kế toán/Kinh doanh.
* *Cách khắc phục*: Bổ sung Guard Clause kiểm tra `if (inv.isExtended) return false;` trong hàm `isActuallyOverdue` và đồng thời cập nhật `inv.status = 'pending'` trước khi gọi `saveSharedInvoices()`.


* **Lỗi 2: Tính năng tìm kiếm ở `ai-cashflow.js` bị trôi hoặc không khớp tên khách hàng**
* *Biểu hiện*: Gõ chữ "v" hoặc "Vanguard" không ra kết quả hoặc bị nhảy mất dòng do cấu trúc đối tượng dữ liệu lưu trữ khác nhau giữa các phân hệ (`customerName` và `customer`).
* *Cách khắc phục*: Chuẩn hóa thuật toán lọc bằng cách gộp chuỗi tìm kiếm không phân biệt hoa thường (`matchCode || matchCustomer`), lắng nghe trực tiếp sự kiện `input` trên ô `#searchOverdue` y hệt như chuẩn bên `accountant.js`.


* **Lỗi 3: Nút bấm "Phê duyệt nhắc nợ" bị mất liên kết sự kiện**
* *Biểu hiện*: Bấm vào nút gửi AI nhắc nợ ở bảng quản lý quá hạn không có phản hồi hoặc không mở được trang soạn email.
* *Cách khắc phục*: Sử dụng Event Delegation (`document.addEventListener('click', e => { ... })`) để bắt chính xác class `.btn-action-reminder` và điều hướng mượt mà sang `KD-sales-payment-reminders.html?id=${id}`.


## 4. CAM KẾT MINH BẠCH & KỸ THUẬT TRIỂN KHAI

* **Mô hình Dữ liệu**: Ứng dụng chạy hoàn toàn ở phía Client (Client-side Frontend) sử dụng `LocalStorage` làm cơ sở dữ liệu giả lập (`Mock Data`), giúp bảo mật tuyệt đối thông tin, không phụ thuộc vào Internet và đảm bảo tốc độ phản hồi cực nhanh khi chấm điểm đồ án.
* **Quản lý phiên bản**: Toàn bộ mã nguồn được quản lý chặt chẽ thông qua các lệnh Git (`git add`, `git commit`, `git push origin main`) trên kho lưu trữ `cse122-invoicepilot-team18`.

