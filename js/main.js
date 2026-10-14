/* =========================================================
   CORE ROUTER & SESSION ENGINE - MAP TÊN FILE CHUẨN PROJECT
   ========================================================= */

// Map danh sách trang được phép truy cập theo Vai trò (RBAC)
const ROLE_ROUTES = {
    'Quản trị viên (Admin)': [
        'QTV-admin-user-management.html',
        'QTV-admin-customer-management.html',
        'QTV-admin-invoice-settings.html',
        'profile.html',
        'notifications.html'
    ],
    'Kế toán (Accountant)': [
        'KT-accountant-invoice-list.html',
        'KT-accountant-invoice-form.html',
        'KT-accountant-reconciliation.html',
        'profile.html',
        'notifications.html'
    ],
    'Kinh doanh (Sale)': [
        'KD-sales-customer-balance.html',
        'KD-sales-invoice-detail.html',
        'KD-sales-payment-reminders.html',
        'profile.html',
        'notifications.html'
    ],
    'Quản lý (Manager)': [
        'QL-manager-receivable-dashboard.html',
        'QL-manager-cashflow-forecast.html',
        'QL-manager-overdue-invoices.html',
        'profile.html',
        'notifications.html'
    ]
};

// Menu Sidebar động hiển thị theo vai trò
const ROLE_MENUS = {
    'Quản trị viên (Admin)': [
        { title: 'Quản lý Người dùng', icon: 'bx-user-pin', url: 'QTV-admin-user-management.html' },
        { title: 'Quản lý Khách hàng', icon: 'bx-group', url: 'QTV-admin-customer-management.html' },
        { title: 'Cấu hình Hóa đơn', icon: 'bx-slider-alt', url: 'QTV-admin-invoice-settings.html' }
    ],
    'Kế toán (Accountant)': [
        { title: 'Danh sách Hóa đơn', icon: 'bx-receipt', url: 'KT-accountant-invoice-list.html' },
        { title: 'Lập Hóa đơn mới', icon: 'bx-plus-circle', url: 'KT-accountant-invoice-form.html' },
        { title: 'Đối chiếu Dữ liệu', icon: 'bx-git-compare', url: 'KT-accountant-reconciliation.html' }
    ],
    'Kinh doanh (Sale)': [
        { title: 'Công nợ Khách hàng', icon: 'bx-wallet', url: 'KD-sales-customer-balance.html' },
        { title: 'Chi tiết Hóa đơn', icon: 'bx-file', url: 'KD-sales-invoice-detail.html' },
        { title: 'Nhắc nợ Thanh toán', icon: 'bx-mail-send', url: 'KD-sales-payment-reminders.html' }
    ],
    'Quản lý (Manager)': [
        { title: 'Dashboard Công nợ', icon: 'bx-line-chart', url: 'QL-manager-receivable-dashboard.html' },
        { title: 'Dự báo Dòng tiền', icon: 'bx-trending-up', url: 'QL-manager-cashflow-forecast.html' },
        { title: 'Hóa đơn Quá hạn', icon: 'bx-alarm-exclamation', url: 'QL-manager-overdue-invoices.html' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    initAppSession();
});

function initAppSession() {
    const userStr = localStorage.getItem('invoicepilot_current_user');
    const currentPath = window.location.pathname.split('/').pop();

    // Các trang Công khai không cần bắt đăng nhập
    const publicPages = ['Trangchu.html', 'Dangnhap.html', 'forgot-password.html', '403.html', '404.html', ''];
    if (publicPages.includes(currentPath)) {
        return;
    }

    // 1. Nếu chưa đăng nhập mà cố vào trang nội bộ -> Đẩy về Dangnhap.html
    if (!userStr) {
        window.location.href = 'Dangnhap.html';
        return;
    }

    const user = JSON.parse(userStr);

    // 2. Render Sidebar & Thông tin User
    updateSidebarUserInfo(user);
    renderSidebarNav(user, currentPath);

    // 3. Kiểm tra phân quyền trang (RBAC)
    checkAccessPermission(user, currentPath);
}

function updateSidebarUserInfo(user) {
    const nameEls = document.querySelectorAll('#sidebarUserName, #headerUserName');
    const roleEls = document.querySelectorAll('#sidebarUserRole, #headerUserRole');
    const avatarEls = document.querySelectorAll('#avatarShort');

    nameEls.forEach(el => el && (el.innerText = user.name));
    roleEls.forEach(el => el && (el.innerText = user.role));
    avatarEls.forEach(el => {
        if (el && user.name) {
            const initials = user.name.split(' ').map(n => n[0]).join('').slice(-2).toUpperCase();
            el.innerText = initials;
        }
    });
}

function renderSidebarNav(user, currentPath) {
    const navContainer = document.querySelector('.sidebar-nav');
    if (!navContainer) return;

    const menus = ROLE_MENUS[user.role] || [];
    let navHtml = menus.map(m => `
        <a href="${m.url}" class="nav-link ${currentPath === m.url ? 'active' : ''}">
            <i class='bx ${m.icon}'></i> <span>${m.title}</span>
        </a>
    `).join('');

    // Menu Cá nhân dùng chung
    navHtml += `
        <div class="nav-group-title" style="margin-top: 15px; font-size: 0.75rem; color: #64748b; padding: 0 10px;">CÁ NHÂN</div>
        <a href="profile.html" class="nav-link ${currentPath === 'profile.html' ? 'active' : ''}">
            <i class='bx bx-user-circle'></i> <span>Hồ sơ cá nhân</span>
        </a>
        <a href="notifications.html" class="nav-link ${currentPath === 'notifications.html' ? 'active' : ''}">
            <i class='bx bx-bell'></i> <span>Thông báo</span>
        </a>
        <a href="Trangchu.html" id="btnHomeAction" class="nav-link" style="color: #f87171;">
            <i class='bx bx-home-alt'></i> <span>Quay lại trang chủ</span>
        </a>
    `;

    navContainer.innerHTML = navHtml;

}

function checkAccessPermission(user, currentPath) {
    const allowedRoutes = ROLE_ROUTES[user.role] || [];
    
    if (allowedRoutes.length > 0 && !allowedRoutes.includes(currentPath)) {
        console.warn(`Truy cập bị từ chối: Role [${user.role}] không có quyền vào [${currentPath}]`);
        window.location.href = '403.html';
    }
}