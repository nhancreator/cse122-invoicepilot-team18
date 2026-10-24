document.addEventListener('DOMContentLoaded', () => {
    // --- TOAST NOTIFICATION HELPER ---
    function showToast(message, type = 'success') {
        const existingToast = document.getElementById('cyberToast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'cyberToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        toast.style.color = '#fff';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        toast.style.zIndex = '9999';
        toast.style.fontSize = '0.85rem';
        toast.style.fontWeight = '600';
        toast.style.backdropFilter = 'blur(10px)';
        toast.style.transition = 'all 0.3s ease';
        toast.innerHTML = `<i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}' style="margin-right: 8px;"></i> ${message}`;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- HỆ THỐNG LƯU TRỮ & ĐỒNG BỘ CHUNG ---
    function getSharedData(key, defaultVal) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultVal;
    }

    function saveSharedData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('invoicepilot_data_changed', { detail: { key, data } }));
    }


    // --- 1. MODULE: QUẢN LÝ KHÁCH HÀNG (QTV-admin-customer-management) - ĐỒNG BỘ TỪ HÓA ĐƠN ---
    function initCustomerManagement() {
        const STORAGE_KEY = 'invoicepilot_customers';
        const defaultCustomers = [
            { code: 'KH-001', name: 'Tập đoàn X', tax: '0100123456', email: 'contact@tapdoanx.vn', status: 'Hoạt động' },
            { code: 'KH-002', name: 'Công ty Cổ phần A', tax: '0309876543', email: 'info@cpa.vn', status: 'Hoạt động' }
        ];

        const tbody = document.getElementById('customerTableBody');
        if (!tbody) return;

        function getCustomers() {
            let customers = getSharedData(STORAGE_KEY, defaultCustomers);
            
            // Tự động lấy thêm danh sách khách hàng từ các hóa đơn mới do Kế toán/Kinh doanh tạo ra
            let invoices = [];
            if (window.InvoiceAPI) {
                invoices = window.InvoiceAPI.getCollection('invoices');
            } else {
                try {
                    const raw = localStorage.getItem('invoicepilot_data');
                    if (raw) invoices = JSON.parse(raw).invoices || [];
                } catch(e) {}
                if (invoices.length === 0) {
                    try { invoices = JSON.parse(localStorage.getItem('invoicepilot_invoices')) || []; } catch(e) {}
                }
            }

            // Đồng bộ tên khách hàng từ hóa đơn vào danh sách QTV nếu chưa có
            invoices.forEach((inv, idx) => {
                const custName = inv.customerName || inv.customer;
                if (custName) {
                    const exists = customers.some(c => c.name.toLowerCase() === custName.toLowerCase());
                    if (!exists) {
                        customers.push({
                            code: `KH-SYN-${idx + 100}`,
                            name: custName,
                            tax: inv.taxCode || '0109998888',
                            email: `contact@${custName.toLowerCase().replace(/[^a-z0-9]/g, '')}.vn`,
                            status: 'Hoạt động'
                        });
                    }
                }
            });

            return customers;
        }

        function saveCustomers(customers) {
            saveSharedData(STORAGE_KEY, customers);
            if (window.InvoiceAPI) {
                window.InvoiceAPI.saveCollection('customers', customers);
            }
        }

        function renderTable() {
            const customers = getCustomers();
            tbody.innerHTML = '';
            customers.forEach((cust, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${cust.code}</strong></td>
                    <td>${cust.name}</td>
                    <td>${cust.tax}</td>
                    <td>${cust.email}</td>
                    <td><span class="badge badge-success">${cust.status}</span></td>
                    <td>
                        <button class="btn btn-outline btn-edit" data-index="${index}" style="padding: 4px 10px; font-size: 0.75rem; margin-right: 6px;">Sửa</button>
                        <button class="btn btn-outline btn-delete" data-index="${index}" style="padding: 4px 10px; font-size: 0.75rem; color: #f87171; border-color: rgba(239,68,68,0.3);">Xóa</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            attachEvents();
        }

        const modal = document.getElementById('customerModal');
        const btnOpen = document.getElementById('btnOpenAddModal');
        if (btnOpen && modal) {
            btnOpen.addEventListener('click', () => {
                document.getElementById('modalTitle').innerText = 'Thêm Khách Hàng Mới';
                document.getElementById('custIndex').value = '';
                document.getElementById('custCode').value = '';
                document.getElementById('custName').value = '';
                document.getElementById('custTax').value = '';
                document.getElementById('custEmail').value = '';
                modal.style.display = 'flex';
            });
        }

        const btnClose = document.getElementById('btnCloseModal');
        if (btnClose && modal) {
            btnClose.addEventListener('click', () => { modal.style.display = 'none'; });
        }

        const form = document.getElementById('customerForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const index = document.getElementById('custIndex').value;
                const newCust = {
                    code: document.getElementById('custCode').value,
                    name: document.getElementById('custName').value,
                    tax: document.getElementById('custTax').value,
                    email: document.getElementById('custEmail').value,
                    status: 'Hoạt động'
                };
                let customers = getCustomers();
                if (index === '') customers.push(newCust);
                else customers[index] = newCust;
                saveCustomers(customers);
                if (modal) modal.style.display = 'none';
                renderTable();
                showToast('Đã lưu dữ liệu khách hàng thành công!', 'success');
            });
        }

        function attachEvents() {
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = e.target.getAttribute('data-index');
                    const customers = getCustomers();
                    const cust = customers[index];
                    document.getElementById('modalTitle').innerText = 'Chỉnh Sửa Khách Hàng';
                    document.getElementById('custIndex').value = index;
                    document.getElementById('custCode').value = cust.code;
                    document.getElementById('custName').value = cust.name;
                    document.getElementById('custTax').value = cust.tax;
                    document.getElementById('custEmail').value = cust.email;
                    if (modal) modal.style.display = 'flex';
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = e.target.getAttribute('data-index');
                    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
                        let customers = getCustomers();
                        customers.splice(index, 1);
                        saveCustomers(customers);
                        renderTable();
                        showToast('Đã xóa khách hàng thành công!', 'success');
                    }
                });
            });
        }

        if (!localStorage.getItem(STORAGE_KEY)) {
            saveCustomers(defaultCustomers);
        }
        renderTable();

        window.addEventListener('storage', (event) => {
            if (event.key === STORAGE_KEY || event.key === 'invoicepilot_invoices' || event.key === 'invoicepilot_data') {
                renderTable();
            }
        });

        window.addEventListener('invoicepilot_data_changed', () => {
            renderTable();
        });
    }


    // --- 2. MODULE: QUẢN LÝ NGƯỜI DÙNG (QTV-admin-user-management) ---
    function initUserManagement() {
        const USERS_KEY = 'invoicepilot_users';
        const defaultUsers = [
            { name: 'Đỗ Duy Nhân', username: 'duynhan', role: 'Kế toán (Accountant)', status: 'Hoạt động' },
            { name: 'Nguyên Nhân Quân', username: 'admin', role: 'Quản trị viên (Admin)', status: 'Hoạt động' },
            { name: 'Đàm Minh Quân', username: 'minhquan', role: 'Kinh doanh(Sale)', status: 'Hoạt động' },
            { name: 'Trần Khôi Nguyên', username: 'khoinguyen', role: 'Quản lý (Manager)', status: 'Hoạt động' }
        ];

        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;

        function getUsers() {
            return getSharedData(USERS_KEY, defaultUsers);
        }

        function saveUsers(users) {
            saveSharedData(USERS_KEY, users);
        }

        function renderUserTable() {
            const users = getUsers();
            tbody.innerHTML = '';
            users.forEach((u, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${u.name}</strong></td>
                    <td>${u.username}</td>
                    <td><span class="badge" style="background: rgba(139,92,246,0.15); color: #a78bfa;">${u.role}</span></td>
                    <td><span class="badge badge-success">${u.status}</span></td>
                    <td>
                        <button class="btn btn-outline btn-edit-user" data-index="${index}" style="padding: 4px 10px; font-size: 0.75rem; margin-right: 6px;">Sửa</button>
                        <button class="btn btn-outline btn-delete-user" data-index="${index}" style="padding: 4px 10px; font-size: 0.75rem; color: #f87171; border-color: rgba(239,68,68,0.3);">Xóa</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            attachUserEvents();
        }

        const modal = document.getElementById('userModal');
        const btnOpen = document.getElementById('btnOpenUserModal');
        if (btnOpen && modal) {
            btnOpen.addEventListener('click', () => {
                document.getElementById('userModalTitle').innerText = 'Thêm Tài Khoản Mới';
                document.getElementById('userIndex').value = '';
                document.getElementById('fullName').value = '';
                document.getElementById('username').value = '';
                modal.style.display = 'flex';
            });
        }

        const btnClose = document.getElementById('btnCloseUserModal');
        if (btnClose && modal) {
            btnClose.addEventListener('click', () => { modal.style.display = 'none'; });
        }

        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const index = document.getElementById('userIndex').value;
                const newUser = {
                    name: document.getElementById('fullName').value,
                    username: document.getElementById('username').value,
                    role: document.getElementById('userRole').value,
                    status: 'Hoạt động'
                };
                let users = getUsers();
                if (index === '') users.push(newUser);
                else users[index] = newUser;
                saveUsers(users);
                if (modal) modal.style.display = 'none';
                renderUserTable();
                showToast('Đã lưu tài khoản thành công!', 'success');
            });
        }

        function attachUserEvents() {
            document.querySelectorAll('.btn-edit-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = e.target.getAttribute('data-index');
                    const users = getUsers();
                    const u = users[index];
                    document.getElementById('userModalTitle').innerText = 'Chỉnh Sửa Tài Khoản';
                    document.getElementById('userIndex').value = index;
                    document.getElementById('fullName').value = u.name;
                    document.getElementById('username').value = u.username;
                    document.getElementById('userRole').value = u.role;
                    if (modal) modal.style.display = 'flex';
                });
            });

            document.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = e.target.getAttribute('data-index');
                    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
                        let users = getUsers();
                        users.splice(index, 1);
                        saveUsers(users);
                        renderUserTable();
                        showToast('Đã xóa tài khoản thành công!', 'success');
                    }
                });
            });
        }

        if (!localStorage.getItem(USERS_KEY)) {
            saveUsers(defaultUsers);
        }
        renderUserTable();

        window.addEventListener('invoicepilot_data_changed', (e) => {
            if (e.detail?.key === USERS_KEY || !e.detail?.key) renderUserTable();
        });
    }


    // --- 3. MODULE: CẤU HÌNH HÓA ĐƠN (QTV-admin-invoice-settings) ---
    function initInvoiceSettings() {
        const SETTINGS_KEY = 'invoicepilot_settings';
        const defaultSettings = {
            prefix: '1C26TPT',
            taxRate: 10,
            threshold: 100000000,
            provider: 'Viettel S-Invoice'
        };

        const settingsForm = document.getElementById('settingsForm');
        if (!settingsForm) return;

        function loadSettings() {
            const settings = getSharedData(SETTINGS_KEY, defaultSettings);
            const prefixEl = document.getElementById('invPrefix');
            const taxRateEl = document.getElementById('taxRate');
            const thresholdEl = document.getElementById('anomalyThreshold') || document.getElementById('thresholdInput');
            const providerEl = document.getElementById('providerSelect');

            if (prefixEl) prefixEl.value = settings.prefix;
            if (taxRateEl) taxRateEl.value = settings.taxRate;
            if (thresholdEl) thresholdEl.value = settings.threshold;
            if (providerEl) providerEl.value = settings.provider;
        }

        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const settings = {
                prefix: document.getElementById('invPrefix')?.value || '1C26TPT',
                taxRate: document.getElementById('taxRate')?.value || 10,
                threshold: parseFloat(document.getElementById('anomalyThreshold')?.value || document.getElementById('thresholdInput')?.value || 100000000),
                provider: document.getElementById('providerSelect')?.value || 'Viettel S-Invoice',
                updatedAt: new Date().toISOString()
            };

            saveSharedData(SETTINGS_KEY, settings);
            showToast('Đã lưu cấu hình hóa đơn và đồng bộ thành công!', 'success');
        });

        loadSettings();
    }


    // --- 4. MODULE: AI-ANOMALY SCANNER ---
    function initAIAnomaly() {
        const containerId = 'anomalyReportContainer';
        const container = document.getElementById(containerId);
        if (!container) return;

        function getDefaultThreshold() {
            const settings = getSharedData('invoicepilot_settings', { threshold: 100000000 });
            return settings.threshold ? parseFloat(settings.threshold) : 100000000;
        }

        function scan(invoices = []) {
            const threshold = getDefaultThreshold();
            const anomalies = [];

            invoices.forEach((inv) => {
                const issues = [];
                if (!inv.taxCode || inv.taxCode.trim() === '' || inv.taxCode.length < 10) {
                    issues.push({
                        type: 'MISSING_TAX_CODE',
                        level: 'High',
                        message: 'Thiếu mã số thuế hoặc mã số thuế không đạt chuẩn định dạng (dưới 10 ký tự).'
                    });
                }

                const amount = parseFloat(inv.amount || 0);
                if (amount > threshold) {
                    issues.push({
                        type: 'EXCEED_THRESHOLD',
                        level: 'Medium',
                        message: `Giá trị hóa đơn (${amount.toLocaleString('vi-VN')} VNĐ) vượt ngưỡng kiểm soát an toàn (${threshold.toLocaleString('vi-VN')} VNĐ).`
                    });
                }

                if (inv.issueDate && inv.dueDate) {
                    const issueDate = new Date(inv.issueDate);
                    const dueDate = new Date(inv.dueDate);
                    if (dueDate < issueDate) {
                        issues.push({
                            type: 'INVALID_DATE_LOGIC',
                            level: 'High',
                            message: 'Hạn thanh toán sớm hơn ngày phát hành hóa đơn, sai logic thời gian.'
                        });
                    }
                }

                if (issues.length > 0) {
                    anomalies.push({
                        invoiceId: inv.id || inv.code || 'UNKNOWN',
                        customerName: inv.customerName || 'Khách hàng không xác định',
                        amount: amount,
                        issues: issues
                    });
                }
            });

            return anomalies;
        }

        function renderReport() {
            const invoices = window.InvoiceAPI ? window.InvoiceAPI.getCollection('invoices') : [];
            const results = scan(invoices);

            if (results.length === 0) {
                container.innerHTML = `
                    <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: var(--success-color); font-size: 0.85rem; display: flex; align-items: center; gap: 10px;">
                        <i class='bx bx-check-shield' style="font-size: 1.2rem;"></i>
                        <span>AI-Anomaly Engine không phát hiện bất thường nào trong các hóa đơn hiện tại. Dữ liệu hoàn toàn an toàn!</span>
                    </div>
                `;
                return;
            }

            let html = `
                <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #f87171; font-weight: 600;">
                        <i class='bx bx-error-circle' style="font-size: 1.2rem;"></i>
                        <span>Phát hiện ${results.length} hóa đơn có dấu hiệu rủi ro / bất thường cần xử lý:</span>
                    </div>
            `;

            results.forEach(res => {
                html += `
                    <div style="background: #060913; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                            <strong>HĐ: ${res.invoiceId} (${res.customerName})</strong>
                            <span style="color: #f87171; font-weight: 600;">${res.amount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <ul style="margin: 0; padding-left: 18px; font-size: 0.75rem; color: var(--text-secondary);">
                `;
                res.issues.forEach(issue => {
                    html += `<li style="margin-bottom: 4px;"><strong style="color: ${issue.level === 'High' ? '#f87171' : 'var(--warning-color)'};">[${issue.level} Risk]</strong> ${issue.message}</li>`;
                });
                html += `</ul></div>`;
            });

            html += `</div>`;
            container.innerHTML = html;
        }

        renderReport();

        window.addEventListener('invoicepilot_data_changed', () => {
            renderReport();
        });
    }

    // --- KHỞI CHẠY CÁC MODULE THEO NGỮ CẢNH TRANG HIỆN TẠI ---
    initCustomerManagement();
    initUserManagement();
    initInvoiceSettings();
    initAIAnomaly();
});