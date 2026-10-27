document.addEventListener('DOMContentLoaded', () => {
    // --- TOAST NOTIFICATION HELPER ---
    function showToast(message, type = 'success') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
                        type === 'warning' ? 'rgba(245, 158, 11, 0.95)' :
                        type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)';

        toast.style.cssText = `background: ${bgColor}; color: #ffffff; padding: 12px 20px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-size: 0.85rem; font-weight: 600;`;
        toast.innerHTML = `<i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}' style="margin-right: 8px;"></i> ${message}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- DARK / LIGHT MODE SWITCHER ---
    const savedTheme = localStorage.getItem('invoicepilot_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = savedTheme === 'light' ? "<i class='bx bx-sun'></i> Chế độ Tối" : "<i class='bx bx-moon'></i> Đổi giao diện";
        themeToggleBtn.onclick = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('invoicepilot_theme', newTheme);
            themeToggleBtn.innerHTML = newTheme === 'light' ? "<i class='bx bx-sun'></i> Chế độ Tối" : "<i class='bx bx-moon'></i> Đổi giao diện";
            showToast(`Đã chuyển sang chế độ ${newTheme === 'light' ? 'Sáng (Light)' : 'Tối (Dark)'}!`, 'success');
        };
    }

    // --- XUẤT BÁO CÁO CSV ---
    const btnExportCSV = document.getElementById('btnExportCSV');
    if (btnExportCSV) {
        btnExportCSV.onclick = () => {
            const invoices = getSharedInvoices();
            let csvContent = "data:text/csv;charset=utf-8,MaHD,KhachHang,NgayPhatHanh,HanThanhToan,SoTien,TrangThai\r\n";
            invoices.forEach(inv => {
                csvContent += `${inv.id || inv.code},"${inv.customerName || inv.customer}",${inv.issueDate || ''},${inv.dueDate || ''},${inv.amount || 0},${inv.status || 'pending'}\r\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "invoicepilot_manager_report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Xuất tệp báo cáo CSV phân hệ Quản lý thành công!");
        };
    }

    function getSharedInvoices() {
        const rawData = localStorage.getItem('invoicepilot_data');
        if (rawData) {
            try {
                const parsed = JSON.parse(rawData);
                if (parsed.invoices && parsed.invoices.length > 0) return parsed.invoices;
            } catch(e) {}
        }
        const localInv = localStorage.getItem('invoicepilot_invoices');
        if (localInv) {
            try { return JSON.parse(localInv); } catch(e) {}
        }
        return window.InvoiceAPI ? window.InvoiceAPI.getCollection('invoices') : [];
    }

    function saveSharedInvoices(invoices) {
        const rawData = localStorage.getItem('invoicepilot_data');
        if (rawData) {
            try {
                const parsedData = JSON.parse(rawData);
                parsedData.invoices = invoices;
                localStorage.setItem('invoicepilot_data', JSON.stringify(parsedData));
            } catch(e) {}
        }
        localStorage.setItem('invoicepilot_invoices', JSON.stringify(invoices));
        window.dispatchEvent(new CustomEvent('invoicepilot_data_changed', { detail: { invoices } }));
    }

    function isPaidStatus(inv) {
        const st = (inv.status || '').toLowerCase();
        return st.includes('paid') || st.includes('completed') || st.includes('đã thanh toán') || st.includes('hoàn thành');
    }

    function isActuallyOverdue(inv) {
        if (isPaidStatus(inv)) return false;
        if (inv.isExtended) return false;
        
        const st = (inv.status || '').toLowerCase();
        if (st.includes('overdue') || st.includes('quá hạn')) return true;

        if (inv.dueDate && !inv.dueDate.includes('Đang chờ')) {
            let dateStr = String(inv.dueDate).split(' ')[0];
            let dueTime = new Date(dateStr).getTime();
            let nowTime = new Date('2026-10-25').getTime();
            
            if (!isNaN(dueTime) && dueTime < nowTime) {
                return true; 
            }
        }
        return false;
    }

    function loadData() {
        const invoices = getSharedInvoices();
        updateManagerDashboard(invoices);
        renderOverdueTable(invoices);
        renderImportantInvoices(invoices);
        updateCashflowForecast(invoices);
    }

    function updateManagerDashboard(invoices) {
        let totalDebt = 0;
        let totalOverdue = 0;
        let totalCollected = 0;
        let overdueCount = 0;
        let paidCount = 0;

        invoices.forEach(inv => {
            const amount = Number(inv.amount) || 0;
            if (isPaidStatus(inv)) {
                totalCollected += amount;
                paidCount++;
            } else if (isActuallyOverdue(inv)) {
                totalOverdue += amount;
                overdueCount++;
            } else {
                totalDebt += amount;
            }
        });

        const allDebtSum = totalDebt + totalOverdue;
        const totalInvoicesCount = invoices.length || 1;

        let healthScore = 94.0;
        if (overdueCount > 0) {
            healthScore = Math.max(50, 95 - (overdueCount * 15));
        } else if (paidCount === totalInvoicesCount) {
            healthScore = 98.5;
        } else {
            healthScore = 96.0;
        }

        const kpiTotalDebt = document.getElementById('kpiTotalDebt');
        const kpiOverdue = document.getElementById('kpiOverdue');
        const kpiCollected = document.getElementById('kpiCollected');
        const healthScoreEl = document.getElementById('healthScoreValue');
        const healthScoreDesc = document.getElementById('healthScoreDesc');

        if (healthScoreEl) {
            healthScoreEl.innerText = `${healthScore.toFixed(1)} / 100`;
            if (healthScoreDesc) {
                healthScoreDesc.innerText = overdueCount === 0 ? 'Đánh giá: Xuất sắc (Ổn định)' : 'Đánh giá: Cần chú ý';
            }
        }

        if (kpiTotalDebt) kpiTotalDebt.innerText = `${allDebtSum.toLocaleString()} ₫`;
        if (kpiOverdue) {
            kpiOverdue.innerText = `${totalOverdue.toLocaleString()} ₫`;
            const subOverdue = kpiOverdue.nextElementSibling;
            if (subOverdue) subOverdue.innerText = `Cần xử lý gấp ${overdueCount} KH`;
        }
        if (kpiCollected) kpiCollected.innerText = `${totalCollected.toLocaleString()} ₫`;
    }

    function renderImportantInvoices(invoices) {
        const tbody = document.querySelector('.main-wrapper .card .data-table tbody');
        if (!tbody || document.getElementById('forecastTable')) return;

        const targetInvoices = invoices.filter(inv => isActuallyOverdue(inv) || !isPaidStatus(inv));

        if (targetInvoices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">Không có hóa đơn nào cần chú ý đặc biệt.</td></tr>`;
            return;
        }

        tbody.innerHTML = targetInvoices.map(inv => {
            const amount = Number(inv.amount) || 0;
            const overdue = isActuallyOverdue(inv);
            const paid = isPaidStatus(inv);
            const id = inv.id || inv.code;
            const isExtended = inv.isExtended || false;

            let statusBadge = `<span class="badge badge-warning">Trung bình</span>`;
            let overdueText = `<span style="color: var(--warning-color); font-weight: 600;">${inv.dueDate || 'Đang chờ'}</span>`;
            let actionBtn = isExtended 
                ? `<button class="btn btn-outline" disabled style="padding: 6px 12px; font-size: 0.8rem; opacity: 0.6; cursor: not-allowed; color: var(--success-color); border-color: var(--success-color);"><i class='bx bx-check'></i> Đã gia hạn +1 tháng</button>`
                : `<button class="btn btn-outline btn-extend-credit" data-id="${id}" style="padding: 6px 12px; font-size: 0.8rem;">Gia hạn tín dụng</button>`;

            if (overdue) {
                statusBadge = `<span class="badge" style="background: rgba(239,68,68,0.15); color: #f87171;">Cao (High Risk)</span>`;
                overdueText = `<span style="color: #f87171; font-weight: 600;">Quá hạn</span>`;
                actionBtn = `<button class="btn btn-primary btn-action-reminder" data-id="${id}" style="padding: 6px 12px; font-size: 0.8rem;"><i class='bx bx-mail-send'></i> Phê duyệt nhắc nợ</button>`;
            } else if (paid) {
                statusBadge = `<span class="badge badge-success">An toàn</span>`;
                overdueText = `<span style="color: var(--success-color); font-weight: 600;">Đã hoàn thành</span>`;
                actionBtn = `<span style="color: var(--success-color); font-size: 0.8rem; font-weight: 600;">Hoàn tất</span>`;
            }

            return `
                <tr>
                    <td><strong>${id}</strong></td>
                    <td>${inv.customerName || inv.customer || 'Khách hàng'}</td>
                    <td style="font-weight: 600;">${amount.toLocaleString()} VNĐ</td>
                    <td>${overdueText}</td>
                    <td>${statusBadge}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        }).join('');
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-extend-credit');
        if (btn) {
            const id = btn.getAttribute('data-id');
            let invoices = getSharedInvoices();
            let inv = invoices.find(i => (i.id === id || i.code === id));
            
            if (inv) {
                let baseDate = inv.dueDate && !inv.dueDate.includes('Đang chờ') && !inv.dueDate.includes('Gia hạn') 
                    ? new Date(String(inv.dueDate).split(' ')[0]) 
                    : new Date();
                
                if (isNaN(baseDate.getTime())) baseDate = new Date();
                baseDate.setDate(baseDate.getDate() + 30);

                const yyyy = baseDate.getFullYear();
                const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
                const dd = String(baseDate.getDate()).padStart(2, '0');
                const newDueDateStr = `${yyyy}-${mm}-${dd}`;

                inv.dueDate = `${newDueDateStr} (Đã gia hạn +1 tháng)`;
                inv.isExtended = true;
                if (inv.status === 'overdue') inv.status = 'pending';

                saveSharedInvoices(invoices);
                showToast(`Đã gia hạn tín dụng thành công thêm 1 tháng cho hóa đơn ${id}! (${newDueDateStr})`, 'success');
                loadData();
            }
        }
    });

    let selectedRange = 'all';

    function renderOverdueTable(invoices) {
        const tbody = document.querySelector('#overdueTable tbody');
        if (!tbody) return;

        const searchInput = document.getElementById('searchOverdue');
        const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

        const overdueInvoices = invoices.filter(inv => isActuallyOverdue(inv));

        const filtered = overdueInvoices.filter(inv => {
            const matchCode = (inv.code || inv.id || '').toLowerCase().includes(keyword);
            const matchCustomer = (inv.customerName || inv.customer || '').toLowerCase().includes(keyword);
            
            const daysOverdue = (() => {
                const dueDt = new Date(String(inv.dueDate || '').split(' ')[0]);
                const nowDt = new Date('2026-10-25');
                if (!isNaN(dueDt.getTime())) {
                    return Math.max(1, Math.round((nowDt - dueDt) / (1000 * 60 * 60 * 24)));
                }
                return 15;
            })();

            let matchRange = true;
            if (selectedRange === '30') matchRange = daysOverdue <= 30;
            else if (selectedRange === '60') matchRange = daysOverdue > 30;

            return (!keyword || matchCode || matchCustomer) && matchRange;
        });

        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 25px;">Không tìm thấy hóa đơn quá hạn nào phù hợp.</td></tr>`;
            return;
        }

        filtered.forEach((inv) => {
            const amount = Number(inv.amount) || 0;
            const issueDate = inv.issueDate || '2026-09-15';
            const dueDate = inv.dueDate || '2026-09-30';
            
            let daysOverdue = 15;
            const dueDt = new Date(String(dueDate).split(' ')[0]);
            const nowDt = new Date('2026-10-25');
            if (!isNaN(dueDt.getTime())) {
                daysOverdue = Math.max(1, Math.round((nowDt - dueDt) / (1000 * 60 * 60 * 24)));
            }

            const id = inv.id || inv.code;
            const customerName = inv.customerName || inv.customer || 'Khách hàng';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${id}</strong></td>
                <td>${customerName}</td>
                <td>${issueDate}</td>
                <td style="color: #f87171; font-weight: 600;">${dueDate}</td>
                <td style="font-weight: 600;">${amount.toLocaleString()} VNĐ</td>
                <td><span class="badge" style="background: rgba(239,68,68,0.15); color: #f87171;">${daysOverdue} ngày</span></td>
                <td><button class="btn btn-primary btn-action-reminder" data-id="${id}" style="padding: 6px 12px; font-size: 0.8rem;"><i class='bx bx-mail-send'></i> Phê duyệt nhắc nợ</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    const filterOverdueBtns = document.querySelectorAll('.filter-overdue');
    if (filterOverdueBtns.length > 0) {
        filterOverdueBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterOverdueBtns.forEach(b => { b.className = 'btn btn-outline filter-overdue'; });
                btn.className = 'btn btn-primary filter-overdue';
                selectedRange = btn.getAttribute('data-range') || 'all';
                renderOverdueTable(getSharedInvoices());
            });
        });
    }

    const searchOverdue = document.getElementById('searchOverdue');
    if (searchOverdue) {
        // Gỡ bỏ sự kiện input thời gian thực
        searchOverdue.oninput = null;

        // Thay vào đó chỉ tìm khi nhấn phím Enter trên ô input
        searchOverdue.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                renderOverdueTable(getSharedInvoices());
                showToast('Đã lọc danh sách hóa đơn quá hạn!');
            }
        };
    }

    const btnFilterOverdue = document.getElementById('btnFilterOverdue');
    if (btnFilterOverdue) {
        // Khi bấm nút "Lọc" thì mới thực hiện tìm kiếm/lọc
        btnFilterOverdue.addEventListener('click', () => {
            renderOverdueTable(getSharedInvoices());
            showToast('Đã lọc danh sách hóa đơn quá hạn!');
        });
    }

    document.addEventListener('click', (e) => {
        const reminderBtn = e.target.closest('.btn-action-reminder');
        if (!reminderBtn) return;

        const id = reminderBtn.getAttribute('data-id') || 'hóa đơn';
        showToast(`AI đang khởi tạo tiến trình nhắc nợ cho hóa đơn ${id}...`, 'success');

        setTimeout(() => {
            window.location.href = `KD-sales-payment-reminders.html?id=${id}`;
        }, 600);
    });

    function updateCashflowForecast(invoices) {
        const forecastTableBody = document.querySelector('#forecastTable tbody');
        const inflowEl = document.getElementById('inflowValue');
        const outflowEl = document.getElementById('outflowValue');
        const netSurplusEl = document.getElementById('netSurplus');
        const forecastPeriod = document.getElementById('forecastPeriod');

        const periodVal = forecastPeriod ? forecastPeriod.value : '30';

        let baseInflow = 0;
        invoices.forEach(inv => {
            const amount = Number(inv.amount) || 0;
            if (amount < 10000000000000 && !isPaidStatus(inv)) {
                baseInflow += amount;
            }
        });

        let totalInflow = baseInflow;
        let monthsData = [];

        if (periodVal === '90') {
            totalInflow = baseInflow * 2.2;
            const estOut = Math.round(totalInflow * 0.35);
            const net = totalInflow - estOut;
            if (inflowEl) inflowEl.innerText = `${Math.round(totalInflow).toLocaleString()} ₫`;
            if (outflowEl) outflowEl.innerText = `${Math.round(estOut).toLocaleString()} ₫`;
            if (netSurplusEl) netSurplusEl.innerText = `+${Math.round(net).toLocaleString()} ₫`;

            monthsData = [
                { month: 'Tháng 10/2026', in: totalInflow * 0.4, out: estOut * 0.4 },
                { month: 'Tháng 11/2026', in: totalInflow * 0.35, out: estOut * 0.35 },
                { month: 'Tháng 12/2026', in: totalInflow * 0.25, out: estOut * 0.25 }
            ];
        } else if (periodVal === '180') {
            totalInflow = baseInflow * 4.5;
            const estOut = Math.round(totalInflow * 0.35);
            const net = totalInflow - estOut;
            if (inflowEl) inflowEl.innerText = `${Math.round(totalInflow).toLocaleString()} ₫`;
            if (outflowEl) outflowEl.innerText = `${Math.round(estOut).toLocaleString()} ₫`;
            if (netSurplusEl) netSurplusEl.innerText = `+${Math.round(net).toLocaleString()} ₫`;

            monthsData = [
                { month: 'Tháng 10/2026', in: totalInflow * 0.25, out: estOut * 0.25 },
                { month: 'Tháng 11/2026', in: totalInflow * 0.2, out: estOut * 0.2 },
                { month: 'Tháng 12/2026', in: totalInflow * 0.2, out: estOut * 0.2 },
                { month: 'Tháng 01/2027', in: totalInflow * 0.15, out: estOut * 0.15 },
                { month: 'Tháng 02/2027', in: totalInflow * 0.1, out: estOut * 0.1 },
                { month: 'Tháng 03/2027', in: totalInflow * 0.1, out: estOut * 0.1 }
            ];
        } else {
            totalInflow = baseInflow;
            const estOut = Math.round(totalInflow * 0.35);
            const net = totalInflow - estOut;
            if (inflowEl) inflowEl.innerText = `${Math.round(totalInflow).toLocaleString()} ₫`;
            if (outflowEl) outflowEl.innerText = `${Math.round(estOut).toLocaleString()} ₫`;
            if (netSurplusEl) netSurplusEl.innerText = `+${Math.round(net).toLocaleString()} ₫`;

            monthsData = [
                { month: 'Tháng 10/2026', in: totalInflow * 0.5, out: estOut * 0.5 },
                { month: 'Tháng 11/2026', in: totalInflow * 0.35, out: estOut * 0.35 },
                { month: 'Tháng 12/2026', in: totalInflow * 0.15, out: estOut * 0.15 }
            ];
        }

        if (forecastTableBody) {
            if (totalInflow === 0) {
                forecastTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--success-color); padding: 20px;">Đã thu hồi toàn bộ công nợ. Không còn khoản thu dự kiến.</td></tr>`;
            } else {
                forecastTableBody.innerHTML = monthsData.map(item => {
                    const mIn = Math.round(item.in);
                    const mOut = Math.round(item.out);
                    const mNet = mIn - mOut;
                    return `
                        <tr>
                            <td><strong>${item.month}</strong></td>
                            <td style="color: var(--success-color); font-weight: 600;">${mIn.toLocaleString()} VNĐ</td>
                            <td style="color: #f87171;">${mOut.toLocaleString()} VNĐ</td>
                            <td style="font-weight: 600; color: var(--primary-color);">+${mNet.toLocaleString()} VNĐ</td>
                            <td><span class="badge badge-success">Thấp</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }

    const btnRunForecast = document.getElementById('btnRunForecast');
    const forecastPeriod = document.getElementById('forecastPeriod');
    const aiSummaryContent = document.getElementById('aiSummaryContent');

    if (forecastPeriod) {
        forecastPeriod.addEventListener('change', () => loadData());
    }

    if (btnRunForecast) {
        btnRunForecast.addEventListener('click', () => {
            showToast('Đang chạy lại mô hình dự báo dòng tiền AI-3...');
            setTimeout(() => {
                loadData();
                if (aiSummaryContent) {
                    aiSummaryContent.innerHTML = `<strong>Báo cáo AI-3:</strong> Đã cập nhật mô hình dự báo theo kỳ hạn lựa chọn. Trạng thái tài chính an toàn tuyệt đối.`;
                }
                showToast('Cập nhật dự báo dòng tiền thành công!');
            }, 800);
        });
    }

    const btnExport = document.getElementById('btnExportReport');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            showToast('Đang tạo tệp PDF báo cáo tài chính AI-3...');
        });
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'invoicepilot_data' || event.key === 'invoicepilot_invoices') loadData();
    });
    window.addEventListener('invoicepilot_data_changed', () => loadData());

    loadData();
});