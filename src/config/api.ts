// API Configuration
export const API_CONFIG = {
  // Local development
  //BASE_URL: 'https://localhost:7138',
  
  // Production server (uncomment to use)
   BASE_URL: 'http://188.132.201.243',
  
  // API endpoints
  ENDPOINTS: {
    LOGIN: '/api/Auth/login',
    ORDERS: '/api/Orders',
    CUSTOMERS: '/api/Customer',
    TENANT_PING: '/api/TenantPing/info'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get endpoint URL
export const getEndpoint = (key: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return API_CONFIG.ENDPOINTS[key];
};
