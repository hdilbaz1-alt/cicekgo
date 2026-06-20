// API Configuration

// Manuel seçim: Aşağıdaki sabitlerden birini BASE_URL olarak atayın
const LOCAL_BASE_URL = 'http://localhost:5080';
const PROD_BASE_URL = 'https://api-cicekgo-backend.hanyapp.com';

export const API_CONFIG = {
  BASE_URL: PROD_BASE_URL, // Canlı backend (.NET + PostgreSQL)
  ENDPOINTS: {
    LOGIN: '/api/Auth/login',
    ORDERS: '/api/Orders',
    CUSTOMERS: '/api/Customer',
    CUSTOMER_LIST: '/api/Customer/List',
    CUSTOMER_GROUPS: '/api/CustomerGroup/member/list',
    CUSTOMER_GROUP_LIST: '/api/CustomerGroup/list',
    CUSTOMER_GROUP_ADD: '/api/CustomerGroup/add',
    CUSTOMER_GROUP_DELETE: '/api/CustomerGroup/delete',
    CUSTOMER_GROUP_MEMBER_ADD: '/api/CustomerGroup/member/add',
    TENANT_PING: '/api/TenantPing/info',
    ORDER_CODE_LIST: '/api/OrderCode/list',
    ORDER_CODE_ADD: '/api/OrderCode/Add',
    ORDER_CODE_UPDATE: '/api/OrderCode/update',
    ORDER_CODE_DELETE: '/api/OrderCode/delete',
    CUSTOMER_LEDGER_BALANCES: '/api/CustomerLedger/balances',
    CUSTOMER_LEDGER_LIST: '/api/CustomerLedger/list',
    CUSTOMER_LEDGER_PAYMENT: '/api/CustomerLedger/payment',
    CUSTOMER_LEDGER_ORDER_PAYMENT: '/api/CustomerLedger/order-payment',
    CUSTOMER_LEDGER_PAYOUT: '/api/CustomerLedger/payout',
    PAYMENT_METHOD_LIST: '/api/PaymentMethod/list',
    PAYMENT_METHOD_ADD: '/api/PaymentMethod/add',
    PAYMENT_METHOD_UPDATE: '/api/PaymentMethod/update',
    PAYMENT_METHOD_DELETE: '/api/PaymentMethod/delete',
    PAYMENT_METHOD_SET_DEFAULT: '/api/PaymentMethod/set-default',

    CUSTOMER_LEDGER_ENTRY: '/api/CustomerLedger/entry',
    REFUND_LIST: '/api/Refund/list',
    REFUND_SUMMARY: '/api/Refund/summary',
    REFUND_PROCESS: '/api/Refund', // /{id}/process
    REFUND_SEARCH: '/api/Refund/search',
    ORDERS_SEARCH: '/api/Orders/search',
    PRODUCT_TYPE_LIST: '/api/ProductType/list',
    PRODUCT_TYPE_ADD: '/api/ProductType/add',
    PRODUCT_TYPE_UPDATE: '/api/ProductType/update',
    PRODUCT_TYPE_DELETE: '/api/ProductType/delete',
    ORDER_STATUS_LIST: '/api/OrderStatus/list',
    ORDER_STATUS_ADD: '/api/OrderStatus/add',
    ORDER_STATUS_UPDATE: '/api/OrderStatus/update',
    ORDER_STATUS_DELETE: '/api/OrderStatus/delete',
    ORDER_STATUS_REORDER: '/api/OrderStatus/reorder',

    // Süper-admin (platform) — firma (tenant) + kullanıcı/rol yönetimi
    ADMIN_TENANTS: '/api/Admin/tenants',
    ADMIN_PERMISSIONS: '/api/Admin/permissions',
    // Firma içi kullanıcı/rol yönetimi (Firma Sahibi)
    ADMIN_USERS: '/api/Admin/users',
    ADMIN_ROLES: '/api/Admin/roles',

    // Ürün / kategori / stok
    PRODUCT_LIST: '/api/Product/list',
    PRODUCT: '/api/Product',
    PRODUCT_CATEGORIES: '/api/Product/categories',
    STOCK_MOVEMENTS: '/api/Stock/movements',
    STOCK_CRITICAL: '/api/Stock/critical',
    UNIT_LIST: '/api/Unit/list',
    UNIT: '/api/Unit',
    STORE_SETTINGS: '/api/StoreSettings',
    COMPANY_PROFILE: '/api/Company/profile',
    EXPENSE_LIST: '/api/Expense/list',
    EXPENSE: '/api/Expense',
    CASH_MOVEMENTS: '/api/Cash/movements',
    CASH_SUMMARY: '/api/Cash/summary',
    DASHBOARD_SUMMARY: '/api/Dashboard/summary',
    REPORT_SALES: '/api/Reports/sales',
    REPORT_PRODUCTS: '/api/Reports/products',
    REPORT_CUSTOMERS: '/api/Reports/customers',
    REPORT_CASH: '/api/Reports/cash',
    REPORT_COURIERS: '/api/Reports/couriers',
    AUDIT_LIST: '/api/Audit/list',
    PRINT_TEMPLATE_LIST: '/api/PrintTemplate/list',
    PRINT_TEMPLATE: '/api/PrintTemplate'
  }
};

// İki sabit dışa aktar (kullanım kolaylığı için)
export { LOCAL_BASE_URL, PROD_BASE_URL };

// Export BASE_URL and ENDPOINTS separately for convenience
export const BASE_URL = API_CONFIG.BASE_URL;
export const ENDPOINTS = API_CONFIG.ENDPOINTS;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get endpoint URL
export const getEndpoint = (key: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return API_CONFIG.ENDPOINTS[key];
};
