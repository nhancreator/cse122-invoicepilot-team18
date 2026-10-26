/**
 * InvoicePilot Centralized API & State Management (js/api.js)
 * Kiến trúc quản lý trạng thái tập trung qua localStorage với key duy nhất 'invoicepilot_data'
 */

const STORAGE_KEY = 'invoicepilot_data';

// Trạng thái mặc định khởi tạo hệ thống (Mock Data chuẩn hóa)
const DEFAULT_STATE = {
    invoices: [
        { id: 'INV-001', code: 'INV-001', customerName: 'Công ty Cổ phần A', amount: 15000000, taxCode: '0309876543', issueDate: '2026-09-01', dueDate: '2026-10-30', status: 'pending' },
        { id: 'INV-002', code: 'INV-002', customerName: 'Cửa hàng Tiện lợi Beta', amount: 8500000, taxCode: '0101234567', issueDate: '2026-09-05', dueDate: '2026-09-20', status: 'paid' },
        { id: 'INV-003', code: 'INV-003', customerName: 'Tập đoàn Công nghệ X', amount: 30000000, taxCode: '0100123456', issueDate: '2026-09-15', dueDate: '2026-09-30', status: 'overdue' },
        { id: 'INV-008', code: 'INV-008', customerName: 'Tập đoàn X', amount: 30000000, taxCode: '0100123456', issueDate: '2026-09-15', dueDate: '2026-09-30', status: 'overdue' }
    ],
    customers: [
        { code: 'KH-001', name: 'Tập đoàn X', tax: '0100123456', email: 'contact@tapdoanx.vn', status: 'Hoạt động' },
        { code: 'KH-002', name: 'Công ty Cổ phần A', tax: '0309876543', email: 'info@cpa.vn', status: 'Hoạt động' }
    ],
    users: [
        { name: 'Đàm Minh Quân', username: 'minhquan', role: 'Quản lý (Manager)', status: 'Hoạt động' },
        { name: 'Đỗ Duy Nhân', username: 'duynhan', role: 'Kế toán (Accountant)', status: 'Hoạt động' },
        { name: 'Nguyên Nhân Quân', username: 'admin', role: 'Quản trị viên (Admin)', status: 'Hoạt động' },
        { name: 'Trần Khôi Nguyên', username: 'khoinguyen', role: 'Quản lý (Manager)', status: 'Hoạt động' }
    ],
    settings: {
        prefix: '1C26TPT',
        taxRate: 10,
        threshold: 100000000,
        provider: 'Viettel S-Invoice'
    }
};

const InvoiceAPI = {
    // 1. Lấy toàn bộ trạng thái hệ thống (tự động khởi tạo nếu chưa có)
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
        // Kích hoạt Custom Event cho các view/script trong cùng một tab trình duyệt
        window.dispatchEvent(new CustomEvent('invoicepilot_data_changed', { detail: newState }));
    },

    // 3. Lấy dữ liệu theo phân khúc (collection) như 'invoices', 'customers', v.v.
    getCollection(collectionName) {
        const state = this.getData();
        return state[collectionName] || [];
    },

    // 4. Lưu trực tiếp một collection (Hỗ trợ tương thích ngược với các file script cũ)
    saveCollection(collectionName, items) {
        const state = this.getData();
        state[collectionName] = items;
        this.saveData(state);
    },

    // 5. Thêm bản ghi mới (CRUD - Create)
    addRecord(collectionName, record) {
        const state = this.getData();
        if (!state[collectionName]) state[collectionName] = [];
        state[collectionName].unshift(record);
        this.saveData(state);
        return state[collectionName];
    },

    // 6. Cập nhật bản ghi (CRUD - Update)
    updateRecord(collectionName, idField, idValue, updatedFields) {
        const state = this.getData();
        if (!state[collectionName]) return;
        state[collectionName] = state[collectionName].map(item => {
            if (item[idField] === idValue || item.id === idValue || item.code === idValue) {
                return { ...item, ...updatedFields };
            }
            return item;
        });
        this.saveData(state);
        return state[collectionName];
    },

    // 7. Xóa bản ghi (CRUD - Delete)
    deleteRecord(collectionName, idField, idValue) {
        const state = this.getData();
        if (!state[collectionName]) return;
        state[collectionName] = state[collectionName].filter(item => item[idField] !== idValue && item.id !== idValue && item.code !== idValue);
        this.saveData(state);
        return state[collectionName];
    },

    // 8. Cập nhật cấu hình hệ thống riêng biệt
    updateSettings(newSettings) {
        const state = this.getData();
        state.settings = { ...state.settings, ...newSettings };
        this.saveData(state);
        return state.settings;
    }
};

// Đăng ký toàn cục để các module dễ dàng sử dụng
window.InvoiceAPI = InvoiceAPI;

// Đảm bảo khởi tạo dữ liệu ngay khi tải tệp nếu localStorage đang trống
if (!localStorage.getItem(STORAGE_KEY)) {
    InvoiceAPI.saveData(DEFAULT_STATE);
}