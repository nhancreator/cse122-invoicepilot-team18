# InvoicePilot - Hệ Thống Quản Lý Công Nợ & Theo dõi Hóa đơn cho doanh nghiệp

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](#)
[![JavaScript] (https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](#)

## 📌 1. Giới Thiệu Dự Án 
InvoicePilot là giải pháp Web App Frontend hỗ trợ doanh nghiệp vừa và nhỏ (SME) tự động hóa quy trình theo dõi hóa đơn, đối soát sao kê ngân hàng và dự báo dòng tiền thông minh. 

## 🔗 2. Đường Dẫn Triển Khai & Tài Nguyên
* **Link Live Deployment (GitHub Pages):** [https://nhancreator.github.io/cse122-invoicepilot-team18/](https://nhancreator.github.io/cse122-invoicepilot-team18/)
[https://nhancreator.github.io/cse122-invoicepilot-team18/pages/trangchu.html](https://nhancreator.github.io/cse122-invoicepilot-team18/pages/Trangchu.html)
* **Link Dự Án Figma / Canva**: `[https://www.figma.com/make/By0BlLFJIfE25l45L33pD7/G%E1%BB%99p-n%E1%BB%99i-dung-th%C3%A0nh-m%E1%BB%99t-file?t=v8LnnoLMD5bfNR3X-20&fullscreen=1]`
* **Link Bảng Quản Lý Công Việc (Trello / Jira / Notion)**: `[https://trello.com/invite/b/6add0f39f076be2795d27aec/ATTIdeb54990b157a3aa54aee895b74c4bc1575C2B12/📌-bảng-trello-theo-trạng-thai-cong-việc]`

## 👥 3. Phân Công Vai Trò & Trách Nhiệm Chéo (Cross-Responsibility)
| STT | Họ và Tên | Mã SV | Vai Trò Chính | Trách Nhiệm Chéo (Cross-Responsibility) |
|:---:|:---|:---:|:---|:---|
| 1 | **Đỗ Duy Nhân** | `[2551060659]` | Trưởng Nhóm / QA Dev | Kiểm thử Responsive + Merge Branches (dev → main) + Triển khai Deployment |
| 2 | **Trần Khôi Nguyên** | `[2551060658]` | Frontend Developer | Design System (CSS Variables) + Navigation + Accessibility (A11y)  |
| 3 | **Đàm Minh Quân** | `[2551060665]` | Logic & Lead Dev  | Architecture JavaScript + LocalStorage API + Chuẩn hóa AI UX |

## 🛠️ 4. Hướng Dẫn Chạy Cục Bộ (Local Setup)
```bash
# 1. Tải repository về máy
git clone https://github.com/nhancreator/cse122-invoicepilot-team18.git

# 2. Di chuyển vào thư mục dự án
cd BT-CK

# 3. Mở dự án bằng VS Code và chạy với Open with Live Server (Port 5500)

📁 5. Cấu Trúc Thư Mục Dự Án
BT-CK/
├── assets/                  # Dữ liệu tĩnh, icon, hình ảnh
│   ├── data/
│   │   └── mock-data.json   # Dữ liệu khởi tạo hệ thống
│   ├── icons/               # Bộ icon SVG / PNG
│   └── images/              # Banner, Logo, Avatars
├── css/
│   ├── responsive.css       # Tương thích thiết bị Mobile & Tablet
│   └── style.css            # Giao diện chính hệ thống
├── design/
│   ├── mockups/             # Ảnh chụp bản vẽ thiết kế UI
│   └── figma-link.txt       # Link dự án Figma
├── docs/                    # Tài liệu báo cáo dự án
│   ├── ai-usage-report.md
│   ├── project-proposal.md
│   ├── roles-and-features.md
│   ├── screen-inventory.md
│   └── team-assignment.md
├── js/                      # Mã nguồn JavaScript
│   ├── modules/             # Các mô-đun xử lý nghiệp vụ & AI
│   │   ├── accountant.js
│   │   ├── ai-anomaly.js
│   │   ├── ai-cashflow.js
│   │   └── ai-reminder.js
│   ├── api.js               # Giả lập REST API / LocalStorage Service
│   └── main.js              # Khởi tạo App, Auth & Điều hướng
├── pages/                   # 12 Màn hình chức năng + Đăng nhập + Trang chủ
│   ├── Dangnhap.html
│   ├── KD-sales-*.html
│   ├── KT-accountant-*.html
│   ├── QL-manager-*.html
│   ├── QTV-admin-*.html
│   └── trangchu.html        # Landing page giới thiệu
└── README.md

🎥 6. Minh Chứng Video OBS (1 Màn Hình = 1 Video OBS)
STT	Mã Màn Hình	    Tên Màn Hình / Tệp	                            Sinh Viên Phụ Trách	            Link Video OBS Minh Chứng
<<<<<<< HEAD
1	SCR-01	        pages/KT-accountant-invoice-list.html	        Đỗ Duy Nhân	                    [https://youtu.be/ZPY27WmUlY4]
2	SCR-02	        pages/KT-accountant-invoice-form.html	        Đỗ Duy Nhân	                    [https://youtu.be/9ZF1PAIZAiU]
3	SCR-03	        pages/KT-accountant-reconciliation.html 	    Đỗ Duy Nhân	                    [https://youtu.be/ppG2pna2ogs]
4	SCR-04	        pages/KD-sales-customer-balance.html	        Trần Khôi Nguyên	            https://youtu.be/088Rup8m6YQ
5	SCR-05	        pages/KD-sales-payment-reminders.html	        Trần Khôi Nguyên	            https://youtu.be/F5Vpe2506Co
6	SCR-06	        pages/KD-sales-invoice-detail.html	            Trần Khôi Nguyên	            https://youtu.be/IyjR6LOi3qE
7	SCR-07	        pages/QL-manager-receivable-dashboard.html	    Đàm Minh Quân	                https://youtu.be/tibe5eLLrSs
8	SCR-08	        pages/QL-manager-overdue-invoices.html	        Đàm Minh Quân	                https://youtu.be/Ja63RCrZvjE
9	SCR-09	        pages/QL-manager-cashflow-forecast.html	        Đàm Minh Quân	                https://youtu.be/CbDEh1i5dbQ
10	SCR-10	        pages/QTV-admin-user-management.html	        Trần Khôi Nguyên	            https://youtu.be/tjp83m6uqxU
11	SCR-11	        pages/QTV-admin-customer-management.html	    Đỗ Duy Nhân	                    [https://youtu.be/G_gV0OzGLgU]
12	SCR-12	        pages/QTV-admin-invoice-settings.html	        Đàm Minh Quân	                https://youtu.be/4U9IqwSVd68


