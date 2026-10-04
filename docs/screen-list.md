# BẢNG KIỂM KÊ MÀN HÌNH HỆ THỐNG INVOICEPILOT

Tài liệu kiểm kê chi tiết toàn bộ các màn hình giao diện (Screens) theo vai trò người dùng và các màn hình hệ thống dùng chung trong dự án **InvoicePilot**.

---

## 1. Màn hình Dùng chung & Hệ thống (Shared & System Screens)

| STT | Đường dẫn Tệp (File Path) | Tên Màn Hình | Vai Trò Truу Cập | Mô Tả Chức Năng Chính | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `index.html` | Trang chủ (Landing Page) | Public (Khách) | Giới thiệu giải pháp InvoicePilot, bảng giá dịch vụ và các nút điều hướng Đăng nhập. | Đã hoàn thành |
| 2 | `pages/login.html` | Đăng nhập hệ thống | Tất cả Vai trò | Xác thực người dùng bằng Tên đăng nhập/Password, điều hướng theo Role (Admin/Kế toán/Sale/Quản lý). | Đã hoàn thành |
| 3 | `pages/forgot-password.html` | Khôi phục Mật khẩu | Tất cả Vai trò | Tiếp nhận Email khôi phục, xác minh mã OTP giả lập và hỗ trợ thiết lập lại mật khẩu mới. | Đã hoàn thành |
| 4 | `pages/profile.html` | Hồ sơ Cá nhân | Người dùng đăng nhập | Xem thông tin cá nhân, cập nhật tên, email và đổi mật khẩu cá nhân (đồng bộ `localStorage`). | Đã hoàn thành |
| 5 | `pages/notifications.html` | Trung tâm Thông báo | Người dùng đăng nhập | Hiển thị danh sách thông báo nhắc nợ, cảnh báo quá hạn hóa đơn, thao tác "Đánh dấu đã đọc". | Đã hoàn thành |
| 6 | `pages/403.html` | Lỗi 403 Forbidden | Tất cả | Cảnh báo khi người dùng cố tình truy cập vào phân hệ không đúng thẩm quyền Role; cung cấp nút điều hướng. | Đã hoàn thành |
| 7 | `pages/404.html` | Lỗi 404 Not Found | Tất cả | Thông báo đường dẫn URL không tồn tại hoặc đã bị thay đổi; cung cấp nút quay về Trang chủ. | Đã hoàn thành |

> **Ghi chú về Đăng ký (`register.html`):** Theo luồng nghiệp vụ nội bộ doanh nghiệp của InvoicePilot, tài khoản mới sẽ do Quản trị viên (Admin) trực tiếp khởi tạo và cấp quyền tại màn hình `QTV-admin-user-management.html`, do đó không triển khai form đăng ký công khai.

---

## 2. Màn hình Phân hệ Theo Vai trò (Role-based Screens)

### A. Phân hệ Quản trị viên (System Admin)
* `pages/QTV-admin-user-management.html`: Quản lý tài khoản, danh sách người dùng và phân quyền vai trò.
* `pages/QTV-admin-customer-management.html`: Quản lý danh mục khách hàng doanh nghiệp.
* `pages/QTV-admin-invoice-settings.html`: Cấu hình mẫu hóa đơn, ký số và thiết lập gửi email tự động.

### B. Phân hệ Kế toán (Accountant)
* `pages/KT-invoice-list.html`: Quản lý danh sách hóa đơn, tìm kiếm, lọc trạng thái thanh toán.
* `pages/KT-invoice-create.html`: Lập hóa đơn mới, tính thuế GTGT và tích hợp AI soi lỗi hóa đơn.
* `pages/KT-reconciliation.html`: Đối chiếu dữ liệu hóa đơn với sổ quỹ ngân hàng.

### C. Phân hệ Kinh doanh (Sale)
* `pages/KD-customer-balance.html`: Theo dõi công nợ, số dư phải thu của từng khách hàng.
* `pages/KD-debt-reminder.html`: Soạn thảo và gửi email nhắc nợ tự động (hỗ trợ AI).

### D. Phân hệ Quản lý (Manager)
* `pages/QL-dashboard.html`: Báo cáo tổng quan, chỉ số KPI dòng tiền và dự báo tài chính.