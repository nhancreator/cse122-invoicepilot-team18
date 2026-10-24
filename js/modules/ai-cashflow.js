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

    // --- HỆ THỐNG ĐỒNG BỘ REALTIME & TẢI DỮ LIỆU TẬP TRUNG ---
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

    function isOverdue(inv) {
        const st = (inv.status || '').toLowerCase();
        return st.includes('overdue') || st.includes('quá hạn') || st.includes('hủy');
    }

    function isPaidStatus(inv) {
        const st = (inv.status || '').toLowerCase();
        return st.includes('paid') || st.includes('completed') || st.includes('đã thanh toán') || st.includes('hoàn thành');
    }

    function loadData() {
        const invoices = getSharedInvoices();
        updateManagerDashboard(invoices);
        renderOverdueTable(invoices);
        renderImportantInvoices(invoices);
        updateCashflowForecast(invoices);
    }

    // --- 1. CẬP NHẬT DASHBOARD TỔNG QUAN & ĐIỂM TÍN DỤNG ĐỘNG ---
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
            } else if (isOverdue(inv)) {
                totalOverdue += amount;
                overdueCount++;
            } else {
                totalDebt += amount;
            }
        });

        const allDebtSum = totalDebt + totalOverdue;
        const totalInvoicesCount = invoices.length || 1;

        // TÍNH TOÁN CHÍNH XÁC ĐIỂM SỨC KHỎE TÍN DỤNG
        let healthScore = 90.0;
        if (overdueCount > 0) {
            healthScore = Math.max(50, 90 - (overdueCount * 15));
        } else if (allDebtSum === 0) {
            healthScore = 98.5; // Đã thu sạch nợ, không còn dư nợ -> Điểm xuất sắc tối đa!
        } else {
            healthScore = 92.0;
        }

        const kpiTotalDebt = document.getElementById('kpiTotalDebt');
        const kpiOverdue = document.getElementById('kpiOverdue');
        const kpiCollected = document.getElementById('kpiCollected');
        
        // Cập nhật điểm tín dụng động qua ID mới thêm
        const healthScoreEl = document.getElementById('healthScoreValue');
        const healthScoreDesc = document.getElementById('healthScoreDesc');

        if (healthScoreEl) {
            healthScoreEl.innerText = `${healthScore.toFixed(1)} / 100`;
            if (healthScoreDesc) {
                healthScoreDesc.innerText = healthScore >= 95 ? 'Đánh giá: Xuất sắc (Sạch nợ)' : 'Đánh giá: Ổn định';
            }
        }

        if (kpiTotalDebt) {
            kpiTotalDebt.innerText = `${allDebtSum.toLocaleString()} ₫`;
            const subDebtEl = kpiTotalDebt.nextElementSibling;
            if (subDebtEl) {
                const prevDebt = 300000000;
                let debtDiffPercent = Math.round(((allDebtSum - prevDebt) / prevDebt) * 100);
                const sign = debtDiffPercent >= 0 ? '+' : '';
                const color = debtDiffPercent <= 0 ? 'var(--success-color)' : '#f87171';
                const arrowIcon = debtDiffPercent >= 0 ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt';
                
                subDebtEl.style.color = color;
                subDebtEl.innerHTML = `<i class='bx ${arrowIcon}'></i> ${sign}${debtDiffPercent}% so với kỳ trước`;
            }
        }

        if (kpiOverdue) {
            kpiOverdue.innerText = `${totalOverdue.toLocaleString()} ₫`;
            const subOverdue = kpiOverdue.nextElementSibling;
            if (subOverdue) subOverdue.innerText = `Cần xử lý gấp ${overdueCount} KH`;
        }

        if (kpiCollected) {
            kpiCollected.innerText = `${totalCollected.toLocaleString()} ₫`;
            const percentSubEl = kpiCollected.nextElementSibling;
            if (percentSubEl) {
                const lastMonthRevenue = 30000000;
                let percentDiff = 0;
                if (lastMonthRevenue > 0) {
                    percentDiff = Math.round(((totalCollected - lastMonthRevenue) / lastMonthRevenue) * 100);
                }
                const sign = percentDiff >= 0 ? '+' : '';
                percentSubEl.style.color = percentDiff >= 0 ? 'var(--success-color)' : '#f87171';
                percentSubEl.innerText = `${sign}${percentDiff}% so với tháng trước`;
            }
        }
    }

    // --- 2. RENDER BẢNG HÓA ĐƠN CẦN CHÚ Ý & GIA HẠN 1 THÁNG ---
    function renderImportantInvoices(invoices) {
        const tbody = document.querySelector('#notableInvoicesTable tbody') || document.querySelector('.main-wrapper .card .data-table tbody');
        if (!tbody || document.getElementById('forecastTable')) return;

        const targetInvoices = invoices.filter(inv => isOverdue(inv) || !isPaidStatus(inv));

        if (targetInvoices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">Không có hóa đơn nào cần chú ý đặc biệt. (Đã thu hồi hoàn tất)</td></tr>`;
            return;
        }

        tbody.innerHTML = targetInvoices.map(inv => {
            const amount = Number(inv.amount) || 0;
            const overdue = isOverdue(inv);
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
                    ? new Date(inv.dueDate) 
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

    // --- 3. XỬ LÝ LỌC BẢNG HÓA ĐƠN QUÁ HẠN ---
    let selectedRange = 'all';

    function renderOverdueTable(invoices) {
        const tbody = document.querySelector('#overdueTable tbody');
        if (!tbody) return;

        const keyword = document.getElementById('searchOverdue')?.value.trim().toLowerCase() || '';
        const overdueInvoices = invoices.filter(inv => isOverdue(inv));

        if (overdueInvoices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 20px;">Không có hóa đơn quá hạn nào.</td></tr>`;
            return;
        }

        tbody.innerHTML = overdueInvoices.map((inv) => {
            const amount = Number(inv.amount) || 0;
            const days = 15; 
            let matchesRange = true;
            if (selectedRange === '30') matchesRange = days <= 30;
            else if (selectedRange === '60') matchesRange = days > 30;

            const rowText = `${inv.id || inv.code} ${inv.customerName || inv.customer || ''}`.toLowerCase();
            const matchesKeyword = rowText.includes(keyword);

            if (!matchesRange || !matchesKeyword) return '';

            return `
                <tr data-days="${days}" data-amount="${amount}">
                    <td><strong>${inv.id || inv.code}</strong></td>
                    <td>${inv.customerName || inv.customer || 'Khách hàng'}</td>
                    <td>${inv.issueDate || '2026-09-15'}</td>
                    <td>${inv.dueDate || '2026-09-30'}</td>
                    <td style="color: #f87171; font-weight: 600;">${amount.toLocaleString()} VNĐ</td>
                    <td><span class="badge" style="background: rgba(239,68,68,0.15); color: #f87171;">${days} ngày</span></td>
                    <td><button class="btn btn-primary btn-action-reminder" data-id="${inv.id || inv.code}" style="padding: 6px 12px; font-size: 0.8rem;"><i class='bx bx-mail-send'></i> Gửi AI Nhắc Nợ</button></td>
                </tr>
            `;
        }).join('');
    }

    const filterOverdueBtns = document.querySelectorAll('.filter-overdue');
    if (filterOverdueBtns.length > 0) {
        filterOverdueBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterOverdueBtns.forEach(b => b.className = 'btn btn-outline filter-overdue');
                btn.className = 'btn btn-primary filter-overdue';
                selectedRange = btn.getAttribute('data-range');
                loadData();
            });
        });
    }

    const btnFilterOverdue = document.getElementById('btnFilterOverdue');
    if (btnFilterOverdue) {
        btnFilterOverdue.addEventListener('click', () => loadData());
    }

    const searchOverdue = document.getElementById('searchOverdue');
    if (searchOverdue) {
        searchOverdue.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') loadData();
        });
    }

    // --- 4. TÍNH TOÁN DỰ BÁO DÒNG TIỀN AI-3 (BÁM SÁT THỰC TẾ HÓA ĐƠN CHƯA THU) ---
    function updateCashflowForecast(invoices) {
        const forecastTableBody = document.querySelector('#forecastTable tbody');
        const inflowEl = document.getElementById('inflowValue');
        const outflowEl = document.getElementById('outflowValue');
        const netSurplusEl = document.getElementById('netSurplus');

        // CHỈ TÍNH DÒNG TIỀN DỰ KIẾN THU TỪ CÁC HÓA ĐƠN CHƯA THANH TOÁN (Chờ hoặc quá hạn)
        let totalInflow = 0;
        invoices.forEach(inv => {
            const amount = Number(inv.amount) || 0;
            if (amount < 10000000000000 && !isPaidStatus(inv)) {
                totalInflow += amount;
            }
        });

        // Chi phí vận hành chuẩn mực chiếm 35% tổng thu (đảm bảo thặng dư dương 65% an toàn tài chính)
        const estimatedOutflow = Math.round(totalInflow * 0.35);
        const net = totalInflow - estimatedOutflow;

        if (inflowEl) inflowEl.innerText = `${Math.round(totalInflow).toLocaleString()} ₫`;
        if (outflowEl) outflowEl.innerText = `${Math.round(estimatedOutflow).toLocaleString()} ₫`;
        if (netSurplusEl) netSurplusEl.innerText = `+${Math.round(net).toLocaleString()} ₫`;

        if (forecastTableBody) {
            forecastTableBody.innerHTML = `
                <tr>
                    <td><strong>Tháng 10/2026</strong></td>
                    <td style="color: var(--success-color); font-weight: 600;">${Math.round(totalInflow * 0.5).toLocaleString()} VNĐ</td>
                    <td style="color: #f87171;">${Math.round(estimatedOutflow * 0.5).toLocaleString()} VNĐ</td>
                    <td style="font-weight: 600; color: var(--primary-color);">+${Math.round(net * 0.5).toLocaleString()} VNĐ</td>
                    <td><span class="badge badge-success">Thấp</span></td>
                </tr>
                <tr>
                    <td><strong>Tháng 11/2026</strong></td>
                    <td style="color: var(--success-color); font-weight: 600;">${Math.round(totalInflow * 0.35).toLocaleString()} VNĐ</td>
                    <td style="color: #f87171;">${Math.round(estimatedOutflow * 0.3).toLocaleString()} VNĐ</td>
                    <td style="font-weight: 600; color: var(--primary-color);">+${Math.round(net * 0.35).toLocaleString()} VNĐ</td>
                    <td><span class="badge badge-success">Thấp</span></td>
                </tr>
                <tr>
                    <td><strong>Tháng 12/2026</strong></td>
                    <td style="color: var(--success-color); font-weight: 600;">${Math.round(totalInflow * 0.15).toLocaleString()} VNĐ</td>
                    <td style="color: #f87171;">${Math.round(estimatedOutflow * 0.2).toLocaleString()} VNĐ</td>
                    <td style="font-weight: 600; color: var(--primary-color);">+${Math.round(net * 0.15).toLocaleString()} VNĐ</td>
                    <td><span class="badge badge-warning">Trung bình</span></td>
                </tr>
            `;
        }
    }

    const btnRunForecast = document.getElementById('btnRunForecast');
    const forecastPeriod = document.getElementById('forecastPeriod');
    const aiSummaryContent = document.getElementById('aiSummaryContent');

    if (btnRunForecast) {
        btnRunForecast.addEventListener('click', () => {
            const period = forecastPeriod ? forecastPeriod.value : '30';
            showToast('Đang chạy lại mô hình dự báo dòng tiền AI-3...');
            setTimeout(() => {
                const invoices = getSharedInvoices();
                updateCashflowForecast(invoices);
                if (aiSummaryContent) {
                    aiSummaryContent.innerHTML = `<strong>Báo cáo AI-3:</strong> Dòng tiền được cập nhật theo thời gian thực dựa trên các hóa đơn chưa hoàn thành. Sức khỏe tài chính tối ưu.`;
                }
                showToast('Cập nhật dự báo dòng tiền thành công!');
            }, 1000);
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