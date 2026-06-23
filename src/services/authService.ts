import { getApiUrl, getEndpoint } from '@/config/api';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  data: {
    token: string;
    refreshToken: string;
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

  getRefreshToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  }

  /** Access + refresh token'ı birlikte günceller (login & refresh sonrası). */
  setSession({ token, refreshToken }: { token: string; refreshToken?: string | null }) {
    this.setToken(token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantInfo');
  }

  async login(userName: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(getApiUrl(getEndpoint('LOGIN')), {
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
        this.setSession({ token: data.data.token, refreshToken: data.data.refreshToken });
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
      const response = await fetch(getApiUrl(getEndpoint('TENANT_PING')), {
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

    // Basit token kontrolü - sadece token var mı yok mu kontrol et
    // JWT decode işlemi bazen başarısız olabiliyor
    return token.length > 0;
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

