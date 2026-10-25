# Phân Công Nhiệm Vụ Bài Tập Lớn (Team Assignment & Cross-Responsibility)

| STT | Họ và Tên | Mã SV | Vai Trò | Phụ Trách Nghiệp Vụ Chính (Role-based Screens) | Màn Hình Dùng Chung & Trách Nhiệm Xuyên Suốt (Cross-Responsibility) | Tỷ Lệ |
|:---:|:---|:---:|:---|:---|:---|:---:|
| 1 | **Đỗ Duy Nhân** | 2551060659 | Lead Dev | Phân hệ Kế toán (`KT-*.html`), `pages/QTV-admin-customer-management.html` | **Màn hình chung**: `Trangchu.html`<br>**Trục 1**: Kho dữ liệu `LocalStorage` (`api.js`), Tối ưu Responsive `responsive.css`[cite: 64, 116]. | 100% |
| 2 | **Trần Khôi Nguyên** | 255....... | Frontend Developer | Phân hệ Kinh doanh (`KD-sales-*.html`), `pages/QTV-admin-invoice-settings.html` | **Trục 2**: Architecture JS, Hệ thống thiết kế UI (`style.css`), Điều hướng chung Navigation & Accessibility (A11y)[cite: 64, 116]. | 100% |
| 3 | **Đàm Minh Quân** | 255....... | Logic & QA Dev | Phân hệ Quản lý (`QL-manager-*.html`), `pages/QTV-admin-user-management.html` | **Màn hình chung**: `pages/Dangnhap.html`<br>**Trục 3**: Chuẩn hóa AI UX, Merge Git (`dev` → `main`) & Live Deployment[cite: 64, 116]. | 100% |

---

## Chi Tiết Phân Công Lát Cắt Dọc (Vertical Slice) & Màn Hình Dùng Chung

### 1. Đỗ Duy Nhân (SV1 - Lead Dev)
* **Phân hệ chính**: Phân hệ Kế toán (`KT-accountant-invoice-list.html`, `KT-accountant-invoice-form.html`, `KT-accountant-reconciliation.html`), `QTV-admin-customer-management.html`[cite: 115, 116].
* **Màn hình dùng chung**: `Trangchu.html` (Landing Page hệ thống)[cite: 115, 116].
* **Trách nhiệm chéo**: Quản lý kho dữ liệu trung tâm `LocalStorage` (`js/api.js`), kiểm thử và tối ưu Responsive đa thiết bị (`css/responsive.css`)[cite: 64, 116].
* **Module AI phụ trách**: Giao diện AI-1 (Invoice Anomaly Check & Auto Match)[cite: 115, 116].

### 2. Trần Khôi Nguyên (SV2 - Frontend Developer)
* **Phân hệ chính**: Phân hệ Kinh doanh (`KD-sales-customer-balance.html`, `KD-sales-payment-reminders.html`, `KD-sales-invoice-detail.html`), `QTV-admin-invoice-settings.html`[cite: 115, 116].
* **Trách nhiệm chéo**: Xây dựng hệ thống thiết kế dùng chung Design System (`css/style.css`), thanh điều hướng chung (Navigation/Role Switcher) và đảm bảo chuẩn A11y (Accessibility)[cite: 64, 116].
* **Module AI phụ trách**: Module AI-2 (`js/modules/ai-reminder.js`)[cite: 115, 116].

### 3. Đàm Minh Quân (SV3 - Logic & QA Dev)
* **Phân hệ chính**: Phân hệ Quản lý (`QL-manager-receivable-dashboard.html`, `QL-manager-overdue-invoices.html`, `QL-manager-cashflow-forecast.html`), `QTV-admin-user-management.html`[cite: 115, 116].
* **Màn hình dùng chung**: `pages/Dangnhap.html` (Authentication & Phân quyền Role)[cite: 115, 116].
* **Trách nhiệm chéo**: Chuẩn hóa tương tác 6 bước AI UX, quản lý & duyêt Pull Request hợp nhất nhánh Git (`dev` → `main`) và triển khai sản phẩm lên Live Deployment[cite: 64, 116].
* **Module AI phụ trách**: Module AI-3 (`js/modules/ai-cashflow.js`) & Module AI Anomaly Scanner (`js/modules/ai-anomaly.js`)[cite: 115, 116].