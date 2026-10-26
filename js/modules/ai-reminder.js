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
            link.setAttribute("download", "invoicepilot_sales_report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Xuất tệp báo cáo CSV phân hệ Kinh doanh thành công!");
        };
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
        populateInvoiceSelect(invoices);
        updateDashboardStats(invoices);
    }

    function populateInvoiceSelect(invoices) {
        const reminderTargetSelect = document.getElementById('reminderTarget');
        if (!reminderTargetSelect) return;

        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');

        if (invoices && invoices.length > 0) {
            reminderTargetSelect.innerHTML = invoices.map(inv => 
                `<option value="${inv.id || inv.code}">${inv.id || inv.code} - ${inv.customerName || inv.customer || 'Khách hàng'} (${(Number(inv.amount) || 0).toLocaleString()} VNĐ)</option>`
            ).join('');
            
            if (urlId) {
                reminderTargetSelect.value = urlId;
            }
        }
    }

    function updateDashboardStats(invoices) {
        let totalCollected = 0;
        let totalPending = 0;
        let totalOverdue = 0;

        invoices.forEach(inv => {
            const amount = Number(inv.amount) || 0;
            if (isPaidStatus(inv)) {
                totalCollected += amount;
            } else if (isOverdue(inv)) {
                totalOverdue += amount;
            } else {
                totalPending += amount;
            }
        });

        const totalAll = totalCollected + totalPending + totalOverdue;
        
        let paidPercent = 0;
        let overduePercent = 0;
        let pendingPercent = 0;

        if (totalAll > 0) {
            paidPercent = totalCollected > 0 ? Math.max(2, Math.round((totalCollected / totalAll) * 100)) : 0;
            overduePercent = totalOverdue > 0 ? Math.max(2, Math.round((totalOverdue / totalAll) * 100)) : 0;
            pendingPercent = 100 - (paidPercent + overduePercent);
            if (pendingPercent < 0) pendingPercent = 0;
        }

        const statCards = document.querySelectorAll('div[style*="background: rgba(14, 21, 38, 0.7)"]');
        if (statCards.length >= 3) {
            const sentValEl = statCards[0].querySelector('div:nth-child(2)');
            if (sentValEl) {
                const sentCount = Number(localStorage.getItem('invoicepilot_sent_emails') || 42);
                sentValEl.innerText = `${sentCount} email`;
            }

            const collectedValEl = statCards[1].querySelector('div:nth-child(2)');
            const percentSubEl = statCards[1].querySelector('div:nth-child(3)');

            if (collectedValEl) {
                collectedValEl.innerText = `${totalCollected.toLocaleString()} ₫`;
            }

            if (percentSubEl) {
                const lastMonthRevenue = 300000000;
                let percentDiff = 0;
                
                if (lastMonthRevenue > 0) {
                    percentDiff = Math.round(((totalCollected - lastMonthRevenue) / lastMonthRevenue) * 100);
                }

                const sign = percentDiff >= 0 ? '+' : '';
                const colorClass = percentDiff >= 0 ? 'var(--success-color)' : '#f87171';
                
                percentSubEl.style.color = colorClass;
                percentSubEl.innerText = `${sign}${percentDiff}% so với tháng trước`;
            }
        }

        const progressBarBars = document.querySelectorAll('div[style*="height: 10px"] > div');
        if (progressBarBars.length >= 3) {
            progressBarBars[0].style.width = `${pendingPercent}%`;
            progressBarBars[1].style.width = `${overduePercent}%`;
            progressBarBars[2].style.width = `${paidPercent}%`;
        }

        const legendContainer = document.getElementById('chartLegend') || document.querySelector('div[style*="gap: 20px; font-size: 0.75rem"]');
        if (legendContainer) {
            legendContainer.innerHTML = `
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: var(--warning-color); border-radius: 50%;"></span> Chưa trả (${pendingPercent}%)</span>
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: var(--danger-color); border-radius: 50%;"></span> Quá hạn (${overduePercent}%)</span>
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: var(--success-color); border-radius: 50%;"></span> Đã thu (${paidPercent}%)</span>
            `;
        }
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'invoicepilot_data' || event.key === 'invoicepilot_invoices') {
            loadData();
        }
    });

    window.addEventListener('invoicepilot_data_changed', () => {
        loadData();
    });

    const btnGenerate = document.getElementById('btnGenerateAI');
    const aiContentArea = document.getElementById('aiContentArea');
    const aiStatusBadge = document.getElementById('aiStatusBadge');
    const aiActionFooter = document.getElementById('aiActionFooter');

    if (btnGenerate) {
        btnGenerate.addEventListener('click', () => {
            const targetInvoice = document.getElementById('reminderTarget') ? document.getElementById('reminderTarget').value : 'INV-001';
            const tone = document.getElementById('reminderTone') ? document.getElementById('reminderTone').value : 'formal';
            const userNote = document.getElementById('reminderNote') ? document.getElementById('reminderNote').value.trim() : '';

            if (aiStatusBadge) {
                aiStatusBadge.className = 'badge badge-warning';
                aiStatusBadge.innerText = 'Đang xử lý AI...';
            }
            if (aiActionFooter) aiActionFooter.style.display = 'none';

            if (aiContentArea) {
                aiContentArea.innerHTML = `
                    <div style="text-align: center; color: var(--text-secondary); padding: 50px 20px;">
                        <i class='bx bx-loader-alt bx-spin' style="font-size: 2.5rem; margin-bottom: 12px; color: var(--primary-color);"></i>
                        <p style="font-size: 0.9rem; margin: 0; color: #fff;">AI đang phân tích và tích hợp ghi chú bổ sung...</p>
                    </div>
                `;
            }

            setTimeout(() => {
                if (aiStatusBadge) {
                    aiStatusBadge.className = 'badge badge-success';
                    aiStatusBadge.innerText = 'Hoàn thành (Độ tin cậy 98.6%)';
                }

                let sampleSubject = `[InvoicePilot] Nhắc nhở thanh toán hóa đơn ${targetInvoice}`;
                let sampleBody = `Kính gửi Quý khách hàng,\n\nInvoicePilot xin trân trọng thông báo hóa đơn ${targetInvoice} hiện đang đến hạn thanh toán. Quý công ty vui lòng hoàn tất giao dịch.\n\nTrân trọng,\nBộ phận Kế toán / Kinh doanh.`;

                if (tone === 'urgent') {
                    sampleSubject = `[KHẨN CẤP] Thông báo quá hạn thanh toán hóa đơn ${targetInvoice}`;
                    sampleBody = `Kính gửi Quý khách hàng,\n\nHóa đơn ${targetInvoice} của Quý công ty đã quá hạn thanh toán. Đề nghị thanh toán gấp trong vòng 24 giờ tới.\n\nTrân trọng,\nPhòng Tài chính Doanh nghiệp.`;
                } else if (tone === 'friendly') {
                    sampleSubject = `Nhắc nhở nhẹ nhàng: Hóa đơn ${targetInvoice} sắp tới hạn`;
                    sampleBody = `Chào bạn,\n\nChúng tôi gửi lời nhắc thân thiện về hóa đơn ${targetInvoice} sắp tới hạn thanh toán. Nếu đã chuyển khoản, bạn có thể bỏ qua email này nhé!\n\nChúc bạn một ngày làm việc hiệu quả.`;
                }

                if (userNote) {
                    sampleBody += `\n\n[Ghi chú lưu ý từ Quản lý/Kinh doanh]: ${userNote}`;
                }

                if (aiContentArea) {
                    aiContentArea.innerHTML = `
                        <div style="font-size: 0.85rem; margin-bottom: 12px; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 8px; padding: 10px;">
                            <strong style="color: var(--primary-color);">Lý do AI chọn cấu trúc này:</strong> 
                            <span style="color: var(--text-secondary);">Đã áp dụng giọng văn (${tone})${userNote ? ' và tích hợp thành công ghi chú bổ sung.' : '.'}</span>
                        </div>
                        
                        <div style="background: #060913; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; font-size: 0.85rem;">
                            <div style="margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                <strong style="color: var(--text-secondary);">Tiêu đề:</strong> <span id="aiSubjectText" style="color: #fff;">${sampleSubject}</span>
                            </div>
                            <div>
                                <strong style="color: var(--text-secondary); display: block; margin-bottom: 4px;">Nội dung email:</strong>
                                <div id="aiBodyText" style="white-space: pre-line; color: var(--text-primary); background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; font-family: monospace; font-size: 0.8rem;">${sampleBody}</div>
                            </div>
                        </div>
                    `;
                }

                if (aiActionFooter) aiActionFooter.style.display = 'block';
            }, 1200);
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.id === 'btnAccept' || e.target.closest('#btnAccept')) {
            let currentSent = Number(localStorage.getItem('invoicepilot_sent_emails') || 42);
            currentSent += 1;
            localStorage.setItem('invoicepilot_sent_emails', currentSent);
            loadData();

            showToast('Đã chấp nhận nội dung AI và gửi email thành công!');
            if (aiActionFooter) aiActionFooter.style.display = 'none';
            if (aiStatusBadge) {
                aiStatusBadge.className = 'badge badge-success';
                aiStatusBadge.innerText = 'Đã gửi thành công';
            }
        } else if (e.target.id === 'btnReject' || e.target.closest('#btnReject')) {
            if (confirm('Bạn có chắc chắn muốn từ chối kết quả này?')) {
                if (aiContentArea) {
                    aiContentArea.innerHTML = `
                        <div style="text-align: center; color: var(--text-secondary); padding: 60px 20px;">
                            <i class='bx bx-x-circle' style="font-size: 3rem; margin-bottom: 12px; color: #f87171;"></i>
                            <p style="font-size: 0.9rem; margin: 0;">Đã hủy kết quả AI. Bạn có thể cấu hình lại.</p>
                        </div>
                    `;
                }
                if (aiActionFooter) aiActionFooter.style.display = 'none';
                if (aiStatusBadge) {
                    aiStatusBadge.className = 'badge badge-warning';
                    aiStatusBadge.innerText = 'Đã hủy';
                }
                showToast('Đã hủy kết quả AI nhắc nợ.', 'error');
            }
        } else if (e.target.id === 'btnEdit' || e.target.closest('#btnEdit')) {
            const bodyDiv = document.getElementById('aiBodyText');
            if (bodyDiv) {
                const currentText = bodyDiv.innerText;
                bodyDiv.innerHTML = `<textarea id="manualEditArea" style="width: 100%; height: 120px; background: #0b0f19; color: #fff; border: 1px solid var(--primary-color); border-radius: 6px; padding: 8px; font-family: monospace; font-size: 0.8rem; resize: vertical;">${currentText}</textarea>
                <button id="btnSaveManual" class="btn btn-primary" style="margin-top: 8px; padding: 4px 12px; font-size: 0.75rem;">Lưu thay đổi</button>`;
                showToast('Đã mở chế độ sửa thủ công.', 'success');
            }
        } else if (e.target.id === 'btnSaveManual' || e.target.closest('#btnSaveManual')) {
            const editArea = document.getElementById('manualEditArea');
            if (editArea) {
                const newText = editArea.value;
                const parentBox = editArea.parentElement;
                parentBox.innerText = newText;
                showToast('Đã lưu nội dung chỉnh sửa thành công!', 'success');
            }
        }
    });

    // --- XỬ LÝ LỌC & TÌM KIẾM TRANG CÔNG NỢ KHÁCH HÀNG ---
    const customerBalanceTbody = document.querySelector('.data-table tbody');
    const isCustomerBalancePage = document.querySelector('h1')?.textContent.includes('Theo Dõi Công Nợ Khách Hàng');

    if (customerBalanceTbody && isCustomerBalancePage) {
        let currentFilter = 'all';

        function renderCustomerBalance() {
            const invoices = getSharedInvoices();
            const searchInputEl = document.getElementById('salesSearchInput');
            const searchKeyword = searchInputEl ? searchInputEl.value.trim().toLowerCase() : '';
            
            customerBalanceTbody.innerHTML = '';
            let totalDebtAll = 0;

            invoices.forEach((inv, index) => {
                const isPaid = isPaidStatus(inv);
                const overdue = isOverdue(inv);
                const amount = Number(inv.amount) || 0;
                const paidAmount = isPaid ? amount : 0;
                const remaining = isPaid ? 0 : amount;

                if (!isPaid) totalDebtAll += remaining;

                let matchFilter = true;
                if (currentFilter === 'overdue') {
                    matchFilter = overdue || !isPaid;
                } else if (currentFilter === 'paid') {
                    matchFilter = isPaid;
                }

                const customerName = (inv.customerName || inv.customer || 'Khách hàng').toLowerCase();
                const customerCode = `kh-10${index + 1}`.toLowerCase();
                const matchSearch = !searchKeyword || customerName.includes(searchKeyword) || customerCode.includes(searchKeyword);

                if (!matchFilter || !matchSearch) return;

                let statusText = 'Đang nợ đến hạn';
                let badgeClass = 'badge-warning';

                if (isPaid) {
                    statusText = 'Hoàn thành';
                    badgeClass = 'badge-success';
                } else if (overdue) {
                    statusText = 'Quá hạn';
                    badgeClass = 'badge-danger';
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>KH-10${index + 1}</strong></td>
                    <td>${inv.customerName || inv.customer || 'Khách hàng'}</td>
                    <td>${amount.toLocaleString()} VNĐ</td>
                    <td>${paidAmount.toLocaleString()} VNĐ</td>
                    <td style="color: ${isPaid ? 'var(--success-color)' : (overdue ? '#f87171' : 'var(--warning-color)')}; font-weight: 600;">${remaining.toLocaleString()} VNĐ</td>
                    <td><span class="badge ${badgeClass}" style="${overdue ? 'background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);' : ''}">${statusText}</span></td>
                    <td><a href="KD-sales-invoice-detail.html?id=${inv.id || inv.code}" style="color: var(--primary-color); text-decoration: none; font-weight: 500;">Xem chi tiết</a></td>
                `;
                customerBalanceTbody.appendChild(tr);
            });

            const totalDebtHeader = document.getElementById('headerTotalDebt') || document.querySelector('span[style*="Tổng dư nợ"]');
            if (totalDebtHeader) {
                totalDebtHeader.innerText = `Tổng dư nợ: ${totalDebtAll.toLocaleString()} VNĐ`;
            }
        }

        const inputFields = document.querySelectorAll('input[type="text"], input[type="search"]');
        inputFields.forEach(input => {
            if (input.placeholder && input.placeholder.includes('Tìm tên khách hàng')) {
                input.id = 'salesSearchInput';
                input.oninput = () => renderCustomerBalance();
            }
        });

        const actionButtonsGroup = document.querySelectorAll('button');
        actionButtonsGroup.forEach(btn => {
            const btnText = btn.textContent.trim();
            if (btnText.includes('Tất cả')) {
                btn.onclick = (e) => {
                    setActiveFilterBtn(e.currentTarget, actionButtonsGroup);
                    currentFilter = 'all';
                    renderCustomerBalance();
                };
            } else if (btnText.includes('Còn nợ quá hạn')) {
                btn.onclick = (e) => {
                    setActiveFilterBtn(e.currentTarget, actionButtonsGroup);
                    currentFilter = 'overdue';
                    renderCustomerBalance();
                };
            } else if (btnText.includes('Đã thanh toán đủ')) {
                btn.onclick = (e) => {
                    setActiveFilterBtn(e.currentTarget, actionButtonsGroup);
                    currentFilter = 'paid';
                    renderCustomerBalance();
                };
            } else if (btnText.includes('Lọc dữ liệu')) {
                btn.onclick = () => {
                    renderCustomerBalance();
                    showToast('Đã lọc lại dữ liệu thành công!');
                };
            }
        });

        function setActiveFilterBtn(activeBtn, allButtons) {
            allButtons.forEach(b => {
                if (b.textContent.includes('Tất cả') || b.textContent.includes('Còn nợ quá hạn') || b.textContent.includes('Đã thanh toán đủ')) {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-outline');
                    b.style.background = 'transparent';
                    b.style.color = '#fff';
                }
            });
            activeBtn.classList.remove('btn-outline');
            activeBtn.classList.add('btn-primary');
            activeBtn.style.background = 'var(--primary-color)';
        }

        renderCustomerBalance();
        window.addEventListener('invoicepilot_data_changed', renderCustomerBalance);
    }

    // Đọc thuế suất do QTV lưu, mặc định 10%.
    function getConfiguredTaxRate() {
        try {
            const settings = JSON.parse(localStorage.getItem('invoicepilot_settings') || '{}');
            const rate = Number(settings.taxRate ?? 10);
            return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 10;
        } catch (e) { return 10; }
    }

    // --- PHẦN 2: LOGIC XỬ LÝ TRANG CHI TIẾT HÓA ĐƠN ---
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');
    const isInvoiceDetailPage = document.querySelector('.main-wrapper h1')?.textContent.includes('Chi Tiết Hóa Đơn');
    
    function renderInvoiceDetail() {
    if ((invoiceId || isInvoiceDetailPage) && !isCustomerBalancePage && !document.getElementById('reminderTarget')) {
        const invoices = getSharedInvoices();
        const targetId = invoiceId || (invoices.length > 0 ? (invoices[0].id || invoices[0].code) : 'INV-001');
        const currentInv = invoices.find(inv => (inv.id === targetId || inv.code === targetId));

        if (currentInv) {
            const titleEl = document.querySelector('h1');
            if (titleEl) titleEl.innerText = `Chi Tiết Hóa Đơn #${currentInv.id || currentInv.code}`;

            const customerEl = document.querySelector('.card h3');
            if (customerEl) customerEl.innerText = currentInv.customerName || currentInv.customer || 'Khách hàng';

            const statusBadge = document.querySelector('.card .badge');
            const isPaid = isPaidStatus(currentInv);
            const overdue = isOverdue(currentInv);
            
            if (statusBadge) {
                if (isPaid) {
                    statusBadge.className = 'badge badge-success';
                    statusBadge.innerText = 'Đã thanh toán';
                } else if (overdue) {
                    statusBadge.className = 'badge badge-danger';
                    statusBadge.style.cssText = 'background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);';
                    statusBadge.innerText = 'Quá hạn';
                } else {
                    statusBadge.className = 'badge badge-warning';
                    statusBadge.innerText = 'Đang chờ thanh toán';
                }
            }

            const amount = Number(currentInv.amount) || 0;
            const taxRate = getConfiguredTaxRate();
            const vat = amount * taxRate / 100;
            const total = amount + vat;
            const paidText = isPaid ? `Đã thanh toán đủ (${amount.toLocaleString()} VNĐ)` : `Chưa thanh toán (0% / ${amount.toLocaleString()} VNĐ)`;
            const progressBarPercent = isPaid ? '100%' : '0%';
            const progressBarColor = isPaid ? '#10b981' : (overdue ? '#f87171' : '#f59e0b');

            const progressContainer = document.querySelector('.card div[style*="background: rgba(6, 9, 19, 0.4)"]');
            if (progressContainer) {
                progressContainer.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px;">
                        <span style="color: var(--text-secondary);">Tiến độ thanh toán hóa đơn</span>
                        <span style="color: ${progressBarColor}; font-weight: 600;">${paidText}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #1e293b; border-radius: 99px; overflow: hidden;">
                        <div style="width: ${progressBarPercent}; height: 100%; background: ${progressBarColor}; transition: width 0.4s ease;"></div>
                    </div>
                `;
            }

            const tableBody = document.querySelector('.data-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td>1</td>
                        <td>Dịch vụ theo chứng từ phát sinh (${currentInv.id || currentInv.code})</td>
                        <td>1</td>
                        <td>${amount.toLocaleString()} VNĐ</td>
                        <td>${amount.toLocaleString()} VNĐ</td>
                    </tr>
                `;
            }

            const summaryCard = document.querySelector('.card div[style*="flex-direction: column"]');
            if (summaryCard) {
                summaryCard.innerHTML = `
                    <div>
                        <h4 style="margin-top: 0; margin-bottom: 16px; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">Tổng quan tài chính</h4>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem;">
                            <span style="color: var(--text-secondary);">Tạm tính:</span>
                            <span>${amount.toLocaleString()} VNĐ</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem;">
                            <span style="color: var(--text-secondary);">Thuế VAT (${taxRate}%):</span>
                            <span>${vat.toLocaleString()} VNĐ</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 1rem; font-weight: bold;">
                            <span>Tổng cộng:</span>
                            <span style="color: var(--primary-color);">${total.toLocaleString()} VNĐ</span>
                        </div>
                    </div>
                    <div>
                        <a href="KD-sales-payment-reminders.html?id=${currentInv.id || currentInv.code}" class="btn btn-primary" style="width: 100%; justify-content: center;"><i class='bx bx-mail-send'></i> Soạn nhắc nợ AI cho HĐ này</a>
                    </div>
                `;
            }
        }
    }

    }
    renderInvoiceDetail();
    window.addEventListener('storage', e => {
        if (e.key === 'invoicepilot_settings' || e.key === 'invoicepilot_data' || e.key === 'invoicepilot_invoices') renderInvoiceDetail();
    });
    window.addEventListener('invoicepilot_data_changed', renderInvoiceDetail);
    loadData();
});
