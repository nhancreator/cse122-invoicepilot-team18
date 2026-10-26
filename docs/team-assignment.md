STT | Họ và Tên | Mã SV | Vai Trò | Phụ Trách Nghiệp Vụ Chính (Role-based Screens) | Màn Hình Dùng Chung & Trách Nhiệm Xuyên Suốt (Cross-Responsibility) | Tỷ Lệ |
|:---:|:---|:---:|:---|:---|:---|:---:|
| 1 | **Đỗ Duy Nhân** | `[2551060659]` | Trưởng Nhóm / QA Dev | Phân hệ Kế toán (`KT-*.html`), `pages/QTV-admin-customer-management.html` | **Trách nhiệm chéo**: Kiểm thử Responsive + Merge Branches (`dev` → `main`) + Triển khai Deployment. | 100% |
| 2 | **Trần Khôi Nguyên** | `[2551060658]` | Frontend Developer | Phân hệ Kinh doanh (`KD-sales-*.html`), `pages/QTV-admin-invoice-settings.html` | **Trách nhiệm chéo**: Design System (CSS Variables) + Navigation + Accessibility (A11y).. | 100% |
| 3 | **Đàm Minh Quân** | `[2551060665]` | Logic & Lead Dev | Phân hệ Quản lý (`QL-manager-*.html`), `pages/QTV-admin-user-management.html` | **Trách nhiệm chéo**: Architecture JavaScript + LocalStorage API + Chuẩn hóa AI UX. | 100% |

---

## Chi Tiết Phân Công Lát Cắt Dọc (Vertical Slice) & Màn Hình Dùng Chung

### 1. Đỗ Duy Nhân (Trưởng Nhóm / QA Dev)
* **Phân hệ chính**: Phân hệ Kế toán (`KT-accountant-invoice-list.html`, `KT-accountant-invoice-form.html`, `KT-accountant-reconciliation.html`), `QTV-admin-customer-management.html`.
* **Trách nhiệm chéo**: Kiểm thử Responsive + Merge Branches (`dev` → `main`) + Triển khai Deployment.
* **Module AI phụ trách**: Giao diện AI-1 (Invoice Anomaly Check & Auto Match).

### 2. Trần Khôi Nguyên (Frontend Developer)
* **Phân hệ chính**: Phân hệ Kinh doanh (`KD-sales-customer-balance.html`, `KD-sales-payment-reminders.html`, `KD-sales-invoice-detail.html`), `QTV-admin-invoice-settings.html`.
* **Trách nhiệm chéo**: Design System (CSS Variables) + Navigation + Accessibility (A11y).
* **Module AI phụ trách**: Module AI-2 (`js/modules/ai-reminder.js`).

### 3. Đàm Minh Quân (Logic & Lead Dev)
* **Phân hệ chính**: Phân hệ Quản lý (`QL-manager-receivable-dashboard.html`, `QL-manager-overdue-invoices.html`, `QL-manager-cashflow-forecast.html`), `QTV-admin-user-management.html`.
* **Trách nhiệm chéo**: Architecture JavaScript + LocalStorage API + Chuẩn hóa AI UX.
* **Module AI phụ trách**: Module AI-3 (`js/modules/ai-cashflow.js`) & Module AI Anomaly Scanner (`js/modules/ai-anomaly.js`).
