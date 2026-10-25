# BẢNG KIỂM KÊ MÀN HÌNH HỆ THỐNG INVOICEPILOT (SCREEN INVENTORY)

---

## Bảng Kiểm Kê Chi Tiết 14 Màn Hình Hệ Thống (Chuẩn 12 Cột)

| Role    | User Goal           | User Task         | Screen Name           | File Path     | CRUD / State  | AI UX | Assignee    | Task ID     | Branch                | OBS Link |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **Public** | Khám phá giải pháp | Xem giới thiệu & Bảng giá | Trang chủ | `Trangchu.html` | Read / Normal | Không | Đỗ Duy Nhân | `TASK-01` | `feature/landing-page` | `[LINK OBS]` |
| **All** | Xác thực hệ thống | Đăng nhập tài khoản | Đăng nhập | `pages/Dangnhap.html` | Read / Normal, Validation | Không | Đàm Minh Quân | `TASK-02` | `feature/auth-login` | `[LINK OBS]` |
| **Kế toán** | Quản lý hóa đơn | Lọc & Xem danh sách hóa đơn | Danh sách hóa đơn | `pages/KT-accountant-invoice-list.html` | Read, Delete / Normal, Empty | Không | Đỗ Duy Nhân | `TASK-03` | `feature/accountant-list` | `[LINK OBS]` |
| **Kế toán** | Lập chứng từ | Tạo mới & Kiểm tra hóa đơn | Form lập hóa đơn | `pages/KT-accountant-invoice-form.html` | Create, Update / Normal, Validation | AI-1 (Anomaly Check) | Đỗ Duy Nhân | `TASK-04` | `feature/accountant-form` | `[LINK OBS]` |
| **Kế toán** | Đối soát tài khoản | Khớp lệnh sao kê ngân hàng | Đối soát công nợ | `pages/KT-accountant-reconciliation.html` | Create, Update / Normal, Loading | AI-1 (Auto Match) | Đỗ Duy Nhân | `TASK-05` | `feature/accountant-reconcile` | `[LINK OBS]` |
| **Kinh doanh**| Theo dõi hạn mức | Tra cứu số dư khách hàng | Công nợ khách hàng | `pages/KD-sales-customer-balance.html` | Read / Normal, Empty | Không | Trần Khôi Nguyên | `TASK-06` | `feature/sales-balance` | `[LINK OBS]` |
| **Kinh doanh**| Đôn đốc công nợ | Gửi thư nhắc thanh toán | Nhắc nợ tự động | `pages/KD-sales-payment-reminders.html` | Create, Update / Normal, Success | AI-2 (Smart Reminder) | Trần Khôi Nguyên | `TASK-07` | `feature/sales-reminder` | `[LINK OBS]` |
| **Kinh doanh**| Xử lý sự cố nợ | Xem chi tiết lịch sử hóa đơn | Chi tiết hóa đơn | `pages/KD-sales-invoice-detail.html` | Read, Update / Normal | Không | Trần Khôi Nguyên | `TASK-08` | `feature/sales-detail` | `[LINK OBS]` |
| **Quản lý** | Giám sát KPI nợ | Xem Dashboard nợ phải thu | Dashboard Quản lý | `pages/QL-manager-receivable-dashboard.html` | Read / Normal, Loading | Không | Đàm Minh Quân | `TASK-09` | `feature/manager-dashboard` | `[LINK OBS]` |
| **Quản lý** | Phân loại rủi ro | Báo cáo hóa đơn quá hạn | Danh sách quá hạn | `pages/QL-manager-overdue-invoices.html` | Read, Archive / Normal | Không | Đàm Minh Quân | `TASK-10` | `feature/manager-overdue` | `[LINK OBS]` |
| **Quản lý** | Lập kế hoạch vốn | Xem dự báo dòng tiền 90 ngày| Dự báo dòng tiền | `pages/QL-manager-cashflow-forecast.html` | Read / Normal | AI-3 (Cashflow Forecast)| Đàm Minh Quân | `TASK-11` | `feature/manager-forecast` | `[LINK OBS]` |
| **Admin** | Phân quyền nhân sự | Quản lý tài khoản người dùng | Quản lý người dùng | `pages/QTV-admin-user-management.html` | Create, Read, Update, Disable | Không | Trần Khôi Nguyên | `TASK-12` | `feature/admin-users` | `[LINK OBS]` |
| **Admin** | Quản lý danh mục | Xem & Sửa danh mục khách hàng| Quản lý khách hàng | `pages/QTV-admin-customer-management.html` | Create, Read, Update, Delete | Không | Đỗ Duy Nhân | `TASK-13` | `feature/admin-customers` | `[LINK OBS]` |
| **Admin** | Thiết lập hệ thống | Cấu hình thuế, mẫu hóa đơn | Cấu hình hóa đơn | `pages/QTV-admin-invoice-settings.html` | Create, Read, Update | Không | Đàm Minh Quân | `TASK-14` | `feature/admin-settings` | `[LINK OBS]` |