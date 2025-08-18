const API_BASE_URL = 'https://localhost:7138/api';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  data: {
    token: string;
    expiresAt: string;
    userId: number;
    userName: string;
    tenantId: number;
    roles: Array<{
      id: number;
      name: string;
    }>;
    specialRoles: Array<{
      id: number;
      name: string;
    }>;
  };
  success: boolean;
  message: string | null;
  statusCode: number;
}

export interface TenantInfoResponse {
  data: {
    name: string;
    lkStart: string;
    lkEnd: string;
    isExpired: boolean;
    dbName: string;
  };
  success: boolean;
  message: string | null;
  statusCode: number;
}

class AuthService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantInfo');
  }

  async login(userName: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LoginResponse = await response.json();
      
      if (data.success) {
        this.setToken(data.data.token);
        localStorage.setItem('user', JSON.stringify({
          userId: data.data.userId,
          userName: data.data.userName,
          tenantId: data.data.tenantId,
          roles: data.data.roles,
          specialRoles: data.data.specialRoles
        }));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getTenantInfo(): Promise<TenantInfoResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/TenantPing/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TenantInfoResponse = await response.json();
      
      if (data.success) {
        localStorage.setItem('tenantInfo', JSON.stringify(data.data));
      }

      return data;
    } catch (error) {
      console.error('Tenant info error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Token'ın expire olup olmadığını kontrol et
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  getRemainingDays(): number {
    const tenantInfo = localStorage.getItem('tenantInfo');
    if (!tenantInfo) return 0;

    try {
      const data = JSON.parse(tenantInfo);
      const endDate = new Date(data.lkEnd);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }
}

export const authService = new AuthService();

