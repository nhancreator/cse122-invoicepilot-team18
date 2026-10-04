# Phân Quyền Chi Tiết & Tính Năng Hệ Thống (Roles & Features)

## 1. Quản Trị Viên (QTV - Admin)
* **QTV-admin-user-management.html**: Thêm, sửa, khóa tài khoản nhân viên, phân quyền truy cập.
* **QTV-admin-customer-management.html**: Quản lý danh mục khách hàng, thiết lập hạn mức nợ (Credit Limit).
* **QTV-admin-invoice-settings.html**: Cấu hình mẫu hóa đơn, tỷ lệ thuế VAT và chữ ký số.

## 2. Kế Toán (KT - Accountant)
* **KT-accountant-invoice-list.html**: Quản lý danh sách hóa đơn, lọc theo trạng thái (Đã thanh toán, Chờ xử lý, Quá hạn).
* **KT-accountant-invoice-form.html**: Lập hóa đơn mới, tự động tính tổng tiền và thuế VAT.
* **KT-accountant-reconciliation.html**: Đối soát sao kê ngân hàng tự động với mô-đun **AI Anomaly**.

## 3. Kinh Doanh (KD - Sales)
* **KD-sales-customer-balance.html**: Tra cứu số dư công nợ và hạn mức khả dụng của khách hàng trước khi lên đơn.
* **KD-sales-invoice-detail.html**: Xem chi tiết lịch sử thanh toán và trạng thái từng hóa đơn của khách.
* **KD-sales-payment-reminders.html**: Soạn và gửi thư nhắc nợ tự động bằng **AI Reminder**.

## 4. Quản Lý (QL - Manager)
* **QL-manager-receivable-dashboard.html**: Dashboard báo cáo tổng quan nợ phải thu và tỷ lệ nợ xấu.
* **QL-manager-cashflow-forecast.html**: Dự báo dòng tiền thực thu 30 ngày tới sử dụng **AI Cashflow**.
* **QL-manager-overdue-invoices.html**: Báo cáo chi tiết danh sách hóa đơn quá hạn phân theo độ tuổi nợ.