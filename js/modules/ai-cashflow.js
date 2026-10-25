
document.addEventListener('DOMContentLoaded', () => {

    // ==============================
    // 1. THÔNG BÁO
    // ==============================
    function showToast(message, type = 'success') {
        const old = document.getElementById('cyberToast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.id = 'cyberToast';
        toast.textContent = message;

        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            background: type === 'success' ? '#059669' : '#dc2626',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: '9999',
            fontSize: '14px',
            fontWeight: '600'
        });

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ==============================
    // 2. DỮ LIỆU HÓA ĐƠN
    // ==============================
    function getSharedInvoices() {
        try {
            const raw = localStorage.getItem('invoicepilot_data');

            if (raw) {
                const data = JSON.parse(raw);
                if (Array.isArray(data.invoices)) {
                    return data.invoices;
                }
            }
        } catch (e) {
            console.error(e);
        }

        try {
            const raw = localStorage.getItem('invoicepilot_invoices');
            if (raw) {
                const data = JSON.parse(raw);
                if (Array.isArray(data)) return data;
            }
        } catch (e) {
            console.error(e);
        }

        if (window.InvoiceAPI &&
            typeof window.InvoiceAPI.getCollection === 'function') {
            return window.InvoiceAPI.getCollection('invoices') || [];
        }

        return [];
    }

    function saveSharedInvoices(invoices) {
        try {
            const raw = localStorage.getItem('invoicepilot_data');

            if (raw) {
                const data = JSON.parse(raw);
                data.invoices = invoices;
                localStorage.setItem(
                    'invoicepilot_data',
                    JSON.stringify(data)
                );
            }

            localStorage.setItem(
                'invoicepilot_invoices',
                JSON.stringify(invoices)
            );

            window.dispatchEvent(
                new CustomEvent('invoicepilot_data_changed')
            );
        } catch (e) {
            console.error(e);
            showToast('Không thể lưu dữ liệu', 'error');
        }
    }

    function isPaidStatus(inv) {
        const status = String(inv.status || '').toLowerCase();

        return status.includes('paid') ||
               status.includes('completed') ||
               status.includes('đã thanh toán') ||
               status.includes('hoàn thành');
    }

    // ==============================
    // 3. XỬ LÝ NGÀY THÁNG
    // ==============================
    function parseDate(value) {
        if (!value) return null;

        const str = String(value).trim();
        let date = null;

        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            const [y, m, d] = str.slice(0, 10)
                .split('-').map(Number);

            date = new Date(y, m - 1, d);

            if (date.getFullYear() !== y ||
                date.getMonth() !== m - 1 ||
                date.getDate() !== d) return null;

        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
            const [d, m, y] = str.slice(0, 10)
                .split('/').map(Number);

            date = new Date(y, m - 1, d);

            if (date.getFullYear() !== y ||
                date.getMonth() !== m - 1 ||
                date.getDate() !== d) return null;
        }

        return date;
    }

    function getOverdueDays(inv) {
        const dueDate = parseDate(inv.dueDate);

        if (!dueDate) {
            return Math.max(0, Number(inv.daysOverdue) || 0);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return Math.max(
            0,
            Math.round((today - dueDate) / 86400000)
        );
    }

    function isOverdue(inv) {
        if (isPaidStatus(inv)) return false;

        const status = String(inv.status || '').toLowerCase();

        if (status.includes('overdue') ||
            status.includes('quá hạn')) {
            return true;
        }

        return getOverdueDays(inv) > 0;
    }

    function getInvoiceId(inv) {
        return String(inv.id || inv.code || '');
    }

    function getCustomer(inv) {
        return String(
            inv.customerName || inv.customer || 'Khách hàng'
        );
    }

    function getAmount(inv) {
        const value = inv.amount;
        if (typeof value === 'number') return value;

        return Number(String(value || '0').replace(/[^\d.-]/g, '')) || 0;
    }

    function formatMoney(amount) {
        return Number(amount).toLocaleString('vi-VN') + ' VNĐ';
    }

    // ==============================
    // 4. CẬP NHẬT DASHBOARD
    // ==============================
    function updateManagerDashboard(invoices) {
        let totalDebt = 0;
        let totalOverdue = 0;
        let totalCollected = 0;
        let overdueCount = 0;

        invoices.forEach(inv => {
            const amount = getAmount(inv);

            if (isPaidStatus(inv)) {
                totalCollected += amount;
            } else if (isOverdue(inv)) {
                totalOverdue += amount;
                overdueCount++;
            } else {
                totalDebt += amount;
            }
        });

        const allDebt = totalDebt + totalOverdue;

        const healthScore = overdueCount > 0
            ? Math.max(50, 90 - overdueCount * 15)
            : allDebt === 0 ? 98.5 : 92;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('kpiTotalDebt', formatMoney(allDebt));
        setText('kpiOverdue', formatMoney(totalOverdue));
        setText('kpiCollected', formatMoney(totalCollected));
        setText('healthScoreValue', healthScore.toFixed(1) + ' / 100');

        setText(
            'healthScoreDesc',
            healthScore >= 95
                ? 'Đánh giá: Xuất sắc (Sạch nợ)'
                : 'Đánh giá: Ổn định'
        );

        const debtEl = document.getElementById('kpiTotalDebt');
        if (debtEl && debtEl.nextElementSibling) {
            const percent = Math.round(
                ((allDebt - 300000000) / 300000000) * 100
            );

            debtEl.nextElementSibling.textContent =
                `${percent >= 0 ? '+' : ''}${percent}% so với kỳ trước`;
        }

        const overdueEl = document.getElementById('kpiOverdue');
        if (overdueEl && overdueEl.nextElementSibling) {
            overdueEl.nextElementSibling.textContent =
                `Cần xử lý gấp ${overdueCount} KH`;
        }

        const collectedEl = document.getElementById('kpiCollected');
        if (collectedEl && collectedEl.nextElementSibling) {
            const percent = Math.round(
                ((totalCollected - 30000000) / 30000000) * 100
            );

            collectedEl.nextElementSibling.textContent =
                `${percent >= 0 ? '+' : ''}${percent}% so với tháng trước`;
        }
    }

    // ==============================
    // 5. BẢNG HÓA ĐƠN CẦN CHÚ Ý
    // ==============================
    function renderImportantInvoices(invoices) {
        const tbody = document.querySelector(
            '#notableInvoicesTable tbody'
        );

        if (!tbody) return;

        const targets = invoices.filter(inv => !isPaidStatus(inv));

        tbody.innerHTML = '';

        if (targets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:20px;">
                        Không có hóa đơn cần chú ý
                    </td>
                </tr>
            `;
            return;
        }

        targets.forEach(inv => {
            const id = getInvoiceId(inv);
            const overdue = isOverdue(inv);
            const tr = document.createElement('tr');

            function cell(value) {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
                return td;
            }

            cell(id);
            cell(getCustomer(inv));
            cell(formatMoney(getAmount(inv)));
            cell(overdue ? 'Quá hạn' : (inv.dueDate || 'Đang chờ'));
            cell(overdue ? 'Cao (High Risk)' : 'Trung bình');

            const td = document.createElement('td');
            const btn = document.createElement('button');

            btn.className = inv.isExtended
                ? 'btn btn-outline'
                : overdue
                    ? 'btn btn-primary btn-action-reminder'
                    : 'btn btn-outline btn-extend-credit';

            btn.dataset.id = id;
            btn.textContent = inv.isExtended
                ? 'Đã gia hạn +1 tháng'
                : overdue
                    ? 'Phê duyệt nhắc nợ'
                    : 'Gia hạn tín dụng';

            btn.disabled = Boolean(inv.isExtended);
            btn.style.padding = '6px 12px';
            btn.style.fontSize = '0.8rem';

            td.appendChild(btn);
            tr.appendChild(td);
            tbody.appendChild(tr);
        });
    }

    // ==============================
    // 6. TÌM KIẾM VÀ LỌC HÓA ĐƠN
    // ==============================
    let selectedRange = 'all';

    function renderOverdueTable(invoices) {
        const tbody = document.querySelector('#overdueTable tbody');
        if (!tbody) return;

        const searchInput = document.getElementById('searchOverdue');

        const keyword = searchInput
            ? searchInput.value.trim().toLowerCase()
            : '';

        const results = invoices.filter(inv => {
            if (!isOverdue(inv)) return false;

            const id = getInvoiceId(inv);
            const customer = getCustomer(inv);

            const contract = String(
                inv.contractName ||
                inv.contractCode ||
                inv.contractId ||
                ''
            );

            const searchText =
                `${id} ${customer} ${contract}`.toLowerCase();

            if (!searchText.includes(keyword)) {
                return false;
            }

            const days = getOverdueDays(inv);

            if (selectedRange === '30' && days >= 30) {
                return false;
            }

            if (selectedRange === '60' && days <= 30) {
                return false;
            }

            return true;
        });

        tbody.innerHTML = '';

        if (results.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');

            td.colSpan = 7;
            td.textContent = 'Không tìm thấy hóa đơn phù hợp';
            td.style.textAlign = 'center';
            td.style.padding = '25px';
            td.style.color = '#94a3b8';

            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        results.forEach(inv => {
            const id = getInvoiceId(inv);
            const days = getOverdueDays(inv);
            const amount = getAmount(inv);

            const tr = document.createElement('tr');
            tr.dataset.days = days;
            tr.dataset.amount = amount;

            function addCell(value, bold = false) {
                const td = document.createElement('td');

                if (bold) {
                    const strong = document.createElement('strong');
                    strong.textContent = value;
                    td.appendChild(strong);
                } else {
                    td.textContent = value;
                }

                tr.appendChild(td);
                return td;
            }

            addCell(id, true);
            addCell(getCustomer(inv));
            addCell(inv.issueDate || 'Chưa có');
            addCell(inv.dueDate || 'Chưa có');

            const amountCell = addCell(formatMoney(amount));
            amountCell.style.color = '#f87171';
            amountCell.style.fontWeight = '600';

            const daysCell = document.createElement('td');
            const badge = document.createElement('span');

            badge.className = 'badge';
            badge.textContent = days + ' ngày';
            badge.style.background = 'rgba(239,68,68,0.15)';
            badge.style.color = '#f87171';

            daysCell.appendChild(badge);
            tr.appendChild(daysCell);

            const actionCell = document.createElement('td');
            const button = document.createElement('button');

            button.className = 'btn btn-primary btn-action-reminder';
            button.dataset.id = id;
            button.style.padding = '6px 12px';
            button.style.fontSize = '0.8rem';
            button.textContent = 'Gửi AI Nhắc Nợ';

            actionCell.appendChild(button);
            tr.appendChild(actionCell);

            tbody.appendChild(tr);
        });
    }

    // Tìm kiếm ngay khi nhập
    const searchOverdue = document.getElementById('searchOverdue');

    if (searchOverdue) {
        searchOverdue.addEventListener('input', () => {
            renderOverdueTable(getSharedInvoices());
        });
    }

    // Nút Lọc
    const btnFilterOverdue = document.getElementById('btnFilterOverdue');

    if (btnFilterOverdue) {
        btnFilterOverdue.addEventListener('click', () => {
            renderOverdueTable(getSharedInvoices());
        });
    }

    // Lọc theo số ngày
    const filterButtons = document.querySelectorAll('.filter-overdue');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-outline');
            });

            btn.classList.remove('btn-outline');
            btn.classList.add('btn-primary');

            selectedRange = btn.dataset.range || 'all';

            renderOverdueTable(getSharedInvoices());
        });
    });

    // ==============================
    // 7. GIA HẠN TÍN DỤNG
    // ==============================
    document.addEventListener('click', e => {
        const btn = e.target.closest('.btn-extend-credit');

        if (!btn) return;

        const id = btn.dataset.id;
        const invoices = getSharedInvoices();

        const inv = invoices.find(item => getInvoiceId(item) === id);

        if (!inv) {
            showToast('Không tìm thấy hóa đơn', 'error');
            return;
        }

        if (inv.isExtended) {
            showToast('Hóa đơn đã được gia hạn', 'error');
            return;
        }

        let date = parseDate(inv.dueDate) || new Date();

        date.setMonth(date.getMonth() + 1);

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        inv.dueDate = `${yyyy}-${mm}-${dd}`;
        inv.isExtended = true;

        if (isOverdue(inv)) {
            inv.status = 'pending';
        }

        saveSharedInvoices(invoices);
        showToast(`Đã gia hạn tín dụng cho ${id}`);
        loadData();
    });

    // ==============================
    // 8. NHẮC NỢ
    // ==============================
    document.addEventListener('click', e => {
        const btn = e.target.closest('.btn-action-reminder');

        if (!btn) return;

        const id = btn.dataset.id || 'hóa đơn';

        showToast(`Đã ghi nhận yêu cầu nhắc nợ cho ${id}`);
    });

    // ==============================
    // 9. DỰ BÁO DÒNG TIỀN
    // ==============================
    function updateCashflowForecast(invoices) {
        let totalInflow = 0;

        invoices.forEach(inv => {
            const amount = getAmount(inv);

            if (!isPaidStatus(inv) && amount < 10000000000000) {
                totalInflow += amount;
            }
        });

        const outflow = Math.round(totalInflow * 0.35);
        const net = totalInflow - outflow;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('inflowValue', formatMoney(totalInflow));
        setText('outflowValue', formatMoney(outflow));
        setText('netSurplus', '+' + formatMoney(net));

        const tbody = document.querySelector('#forecastTable tbody');

        if (!tbody) return;

        tbody.innerHTML = '';

        const months = [
            { name: 'Tháng 10/2026', income: 0.5, expense: 0.5 },
            { name: 'Tháng 11/2026', income: 0.35, expense: 0.3 },
            { name: 'Tháng 12/2026', income: 0.15, expense: 0.2 }
        ];

        months.forEach(month => {
            const income = Math.round(totalInflow * month.income);
            const expense = Math.round(outflow * month.expense);
            const balance = income - expense;

            const tr = document.createElement('tr');

            [
                month.name,
                formatMoney(income),
                formatMoney(expense),
                formatMoney(balance),
                'Thấp'
            ].forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }

    const btnRunForecast = document.getElementById('btnRunForecast');

    if (btnRunForecast) {
        btnRunForecast.addEventListener('click', () => {
            updateCashflowForecast(getSharedInvoices());

            const summary = document.getElementById('aiSummaryContent');

            if (summary) {
                summary.textContent =
                    'Báo cáo AI-3: Dòng tiền đã được cập nhật từ dữ liệu hóa đơn.';
            }

            showToast('Đã cập nhật dự báo dòng tiền');
        });
    }

    const btnExport = document.getElementById('btnExportReport');

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            showToast('Chức năng xuất PDF chưa được triển khai', 'error');
        });
    }

    // ==============================
    // 10. ĐỒNG BỘ DỮ LIỆU
    // ==============================
    function loadData() {
        const invoices = getSharedInvoices();

        updateManagerDashboard(invoices);
        renderOverdueTable(invoices);
        renderImportantInvoices(invoices);
        updateCashflowForecast(invoices);
    }

    window.addEventListener('storage', event => {
        if (
            event.key === 'invoicepilot_data' ||
            event.key === 'invoicepilot_invoices'
        ) {
            loadData();
        }
    });

    window.addEventListener('invoicepilot_data_changed', loadData);

    // Khởi chạy
    loadData();
});
