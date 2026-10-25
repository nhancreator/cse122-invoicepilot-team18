# BẢNG KIỂM KÊ MÀN HÌNH HỆ THỐNG INVOICEPILOT (SCREEN INVENTORY)

---

## Bảng Kiểm Kê Chi Tiết 14 Màn Hình Hệ Thống (Chuẩn 12 Cột)

| Role    | User Goal           | User Task         | Screen Name           | File Path     | CRUD / State  | AI UX | Assignee    | Task ID     | Branch                | OBS Link |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **Public** | Khám phá giải pháp | Xem giới thiệu & Bảng giá | Trang chủ | `Trangchu.html` | Read / Normal | Không || `TASK-01` | `feature/landing-page` |  |
| **All** | Xác thực hệ thống | Đăng nhập tài khoản | Đăng nhập | `pages/Dangnhap.html` | Read / Normal, Validation | Không || `TASK-02` | `feature/auth-login` |  | 
| **Kế toán** | Quản lý hóa đơn | Lọc & Xem danh sách hóa đơn | Danh sách hóa đơn | `pages/KT-accountant-invoice-list.html` | Read, Delete / Normal, Empty | Không | Đỗ Duy Nhân | `TASK-01` | `feature/accountant-list` | `[(https://youtu.be/ZPY27WmUlY4)]` |
| **Kế toán** | Lập chứng từ | Tạo mới & Kiểm tra hóa đơn | Form lập hóa đơn | `pages/KT-accountant-invoice-form.html` | Create, Update / Normal, Validation | AI-1 (Anomaly Check) | Đỗ Duy Nhân | `TASK-02` | `feature/accountant-form` | `[(https://youtu.be/9ZF1PAIZAiU)]` |
| **Kế toán** | Đối soát tài khoản | Khớp lệnh sao kê ngân hàng | Đối soát công nợ | `pages/KT-accountant-reconciliation.html` | Create, Update / Normal, Loading | AI-1 (Auto Match) | Đỗ Duy Nhân | `TASK-03` | `feature/accountant-reconcile` | `[https://youtu.be/ppG2pna2ogs]` |
| **Kinh doanh**| Theo dõi hạn mức | Tra cứu số dư khách hàng | Công nợ khách hàng | `pages/KD-sales-customer-balance.html` | Read / Normal, Empty | Không | Trần Khôi Nguyên | `TASK-01` | `feature/sales-balance` | `[https://youtu.be/088Rup8m6YQ]` |
| **Kinh doanh**| Đôn đốc công nợ | Gửi thư nhắc thanh toán | Nhắc nợ tự động | `pages/KD-sales-payment-reminders.html` | Create, Update / Normal, Success | AI-2 (Smart Reminder) | Trần Khôi Nguyên | `TASK-02` | `feature/sales-reminder` | `[https://youtu.be/F5Vpe2506Co]` |
| **Kinh doanh**| Xử lý sự cố nợ | Xem chi tiết lịch sử hóa đơn | Chi tiết hóa đơn | `pages/KD-sales-invoice-detail.html` | Read, Update / Normal | Không | Trần Khôi Nguyên | `TASK-03` | `feature/sales-detail` | `[https://youtu.be/IyjR6LOi3qE]` |
| **Quản lý** | Giám sát KPI nợ | Xem Dashboard nợ phải thu | Dashboard Quản lý | `pages/QL-manager-receivable-dashboard.html` | Read / Normal, Loading | Không | Đàm Minh Quân | `TASK-01` | `feature/manager-dashboard` | `[https://youtu.be/tibe5eLLrSs]` |
| **Quản lý** | Phân loại rủi ro | Báo cáo hóa đơn quá hạn | Danh sách quá hạn | `pages/QL-manager-overdue-invoices.html` | Read, Archive / Normal | Không | Đàm Minh Quân | `TASK-02` | `feature/manager-overdue` | `[https://youtu.be/Ja63RCrZvjE]` |
| **Quản lý** | Lập kế hoạch vốn | Xem dự báo dòng tiền 90 ngày| Dự báo dòng tiền | `pages/QL-manager-cashflow-forecast.html` | Read / Normal | AI-3 (Cashflow Forecast)| Đàm Minh Quân | `TASK-03` | `feature/manager-forecast` | `[https://youtu.be/CbDEh1i5dbQ]` |
| **Admin** | Phân quyền nhân sự | Quản lý tài khoản người dùng | Quản lý người dùng | `pages/QTV-admin-user-management.html` | Create, Read, Update, Disable | Không | Trần Khôi Nguyên | `TASK-03` | `feature/admin-users` | `[https://youtu.be/tjp83m6uqxU]` |
| **Admin** | Quản lý danh mục | Xem & Sửa danh mục khách hàng| Quản lý khách hàng | `pages/QTV-admin-customer-management.html` | Create, Read, Update, Delete | Không | Đỗ Duy Nhân | `TASK-01` | `feature/admin-customers` | `[https://youtu.be/G_gV0OzGLgU]` |
| **Admin** | Thiết lập hệ thống | Cấu hình thuế, mẫu hóa đơn | Cấu hình hóa đơn | `pages/QTV-admin-invoice-settings.html` | Create, Read, Update | Không | Đàm Minh Quân | `TASK-02` | `feature/admin-settings` | `[https://youtu.be/4U9IqwSVd68]` |
