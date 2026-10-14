/**
 * InvoicePilot Centralized API & State Management (js/api.js)
 * Kiến trúc quản lý trạng thái tập trung qua localStorage với key duy nhất 'invoicepilot_data'
 */

const STORAGE_KEY = 'invoicepilot_data';

// Trạng thái mặc định khởi tạo hệ thống (Mock Data chuẩn hóa)
const DEFAULT_STATE = {
    invoices: [
        { id: 'INV-001', code: 'INV-001', customerName: 'Công ty Cổ phần A', amount: 15000000, taxCode: '0309876543', issueDate: '2026-09-01', dueDate: '2026-09-30', status: 'pending' },
        { id: 'INV-008', code: 'INV-008', customerName: 'Tập đoàn X', amount: 30000000, taxCode: '0100123456', issueDate: '2026-09-15', dueDate: '2026-09-30', status: 'overdue' }
    ],
    customers: [
        { code: 'KH-001', name: 'Tập đoàn X', tax: '0100123456', email: 'contact@tapdoanx.vn', status: 'Hoạt động' },
        { code: 'KH-002', name: 'Công ty Cổ phần A', tax: '0309876543', email: 'info@cpa.vn', status: 'Hoạt động' }
    ],
    users: [
        { name: 'Đỗ Duy Nhân', username: 'duynhan', role: 'Quản lý (Manager)', status: 'Hoạt động' },
        { name: 'Nguyễn Văn Minh', username: 'minhnv', role: 'Kế toán (Accountant)', status: 'Hoạt động' }
    ],
    settings: {
        prefix: '1C26TPT',
        taxRate: 10,
        threshold: 100000000,
        provider: 'Viettel S-Invoice'
    }
};

const InvoiceAPI = {
    // 1. Lấy toàn bộ trạng thái hệ thống
    getData() {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (!rawData) {
            this.saveData(DEFAULT_STATE);
            return DEFAULT_STATE;
        }
        try {
            return JSON.parse(rawData);
        } catch (error) {
            console.error("Lỗi phân tích cú pháp dữ liệu localStorage:", error);
            return DEFAULT_STATE;
        }
    },

    // 2. Lưu toàn bộ trạng thái và kích hoạt tín hiệu đồng bộ Realtime
    saveData(newState) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        
        // Kích hoạt Custom Event cho các view/script trong CÙNG MỘT tab trình duyệt
        window.dispatchEvent(new CustomEvent('invoicepilot_data_changed', { detail: newState }));
    },

    // 3. Lấy dữ liệu theo phân khúc (collection)
    getCollection(collectionName) {
        const state = this.getData();
        return state[collectionName] || [];
    },

    // 4. Thêm bản ghi mới (CRUD - Create)
    addRecord(collectionName, record) {
        const state = this.getData();
        if (!state[collectionName]) state[collectionName] = [];
        state[collectionName].push(record);
        this.saveData(state);
        return state[collectionName];
    },

    // 5. Cập nhật bản ghi (CRUD - Update)
    updateRecord(collectionName, idField, idValue, updatedFields) {
        const state = this.getData();
        if (!state[collectionName]) return;
        state[collectionName] = state[collectionName].map(item => {
            if (item[idField] === idValue) {
                return { ...item, ...updatedFields };
            }
            return item;
        });
        this.saveData(state);
        return state[collectionName];
    },

    // 6. Xóa bản ghi (CRUD - Delete)
    deleteRecord(collectionName, idField, idValue) {
        const state = this.getData();
        if (!state[collectionName]) return;
        state[collectionName] = state[collectionName].filter(item => item[idField] !== idValue);
        this.saveData(state);
        return state[collectionName];
    },

    // 7. Cập nhật cấu hình hệ thống riêng biệt
    updateSettings(newSettings) {
        const state = this.getData();
        state.settings = { ...state.settings, ...newSettings };
        this.saveData(state);
        return state.settings;
    }
};
// js/api.js
window.InvoiceAPI = {
    // Lấy danh sách hóa đơn từ kho lưu trữ chung
    getInvoices() {
        const stored = localStorage.getItem('invoicepilot_invoices');
        if (!stored) {
            const defaultInvoices = [
                { id: 'INV-001', customerName: 'Công ty Cổ phần Alpha', issueDate: '2026-09-01', dueDate: '2026-09-30', amount: 15000000, status: 'pending' },
                { id: 'INV-002', customerName: 'Cửa hàng Tiện lợi Beta', issueDate: '2026-09-05', dueDate: '2026-09-20', amount: 8500000, status: 'paid' },
                { id: 'INV-003', customerName: 'Tập đoàn Công nghệ X', issueDate: '2026-09-15', dueDate: '2026-09-30', amount: 30000000, status: 'overdue' }
            ];
            localStorage.setItem('invoicepilot_invoices', JSON.stringify(defaultInvoices));
            return defaultInvoices;
        }
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    },

    // Thêm hoặc lưu danh sách hóa đơn mới
    saveInvoices(invoices) {
        localStorage.setItem('invoicepilot_invoices', JSON.stringify(invoices));
        // Phát sự kiện thông báo dữ liệu đã thay đổi để các trang tự cập nhật
        window.dispatchEvent(new Event('invoicepilot_data_changed'));
    },

    // Thêm 1 hóa đơn mới từ phân hệ Kế toán
    addInvoice(newInvoice) {
        const invoices = this.getInvoices();
        invoices.unshift(newInvoice); // Đưa lên đầu danh sách
        this.saveInvoices(invoices);
    }
};
// Đăng ký toàn cục để các module dễ dàng sử dụng
window.InvoiceAPI = InvoiceAPI;