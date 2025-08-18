// API Configuration
export const API_CONFIG = {
  // Local development (örnek: Kendi makinen)
  // BASE_URL: 'https://localhost:7138',

  // Env ile kontrol (NEXT_PUBLIC_API_BASE yoksa fallback '/api' olur)
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE || '/api',

  // API endpoints
  ENDPOINTS: {
    LOGIN: '/Auth/login',
    ORDERS: '/Orders',
    CUSTOMERS: '/Customer',
    TENANT_PING: '/TenantPing/info',
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  // Eğer BASE_URL '/api' ise direkt relative çağrı yapar (proxy için)
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get endpoint URL by key
export const getEndpoint = (key: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return API_CONFIG.ENDPOINTS[key];
};
