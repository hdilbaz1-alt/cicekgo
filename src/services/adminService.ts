import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

const ADMIN = () => getApiUrl(getEndpoint('ADMIN_TENANTS'));        // /api/Admin/tenants
const PERMS = () => getApiUrl(getEndpoint('ADMIN_PERMISSIONS'));    // /api/Admin/permissions

export interface TenantDto {
  id: number;
  name: string;
  slug: string;
  dbName: string;
  isActive: boolean;
  licenseStartUtc: string | null;
  licenseEndUtc: string | null;
  createdAtUtc: string;
}

export interface RoleDto {
  id: number;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface UserDto {
  id: number;
  tenantId: number | null;
  username: string;
  email?: string | null;
  fullName?: string | null;
  isActive: boolean;
  isPlatformAdmin: boolean;
  roles: RoleDto[];
}

export interface PermissionDto {
  code: string;
  description?: string | null;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  licenseStartUtc?: string | null;
  licenseEndUtc?: string | null;
  adminUsername: string;
  adminPassword: string;
  adminEmail?: string | null;
  adminFullName?: string | null;
}

export interface UpdateTenantRequest {
  name?: string;
  isActive?: boolean;
  licenseStartUtc?: string | null;
  licenseEndUtc?: string | null;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email?: string | null;
  fullName?: string | null;
  roleIds: number[];
}

export interface UpdateUserRequest {
  fullName?: string | null;
  email?: string | null;
  isActive?: boolean;
  newPassword?: string | null;
  roleIds?: number[] | null;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || (body && body.success === false)) {
    const msg = body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body.data as T;
}

export const adminService = {
  // ---- Tenants (firmalar) ----
  async listTenants(): Promise<TenantDto[]> {
    return handle<TenantDto[]>(await apiFetch(ADMIN(), { headers: authHeaders() }));
  },

  async createTenant(req: CreateTenantRequest): Promise<TenantDto> {
    return handle<TenantDto>(await apiFetch(ADMIN(), {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(req),
    }));
  },

  async updateTenant(id: number, req: UpdateTenantRequest): Promise<TenantDto> {
    return handle<TenantDto>(await apiFetch(`${ADMIN()}/${id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify(req),
    }));
  },

  async deleteTenant(id: number, dropDatabase = false): Promise<void> {
    await handle<string>(await apiFetch(`${ADMIN()}/${id}?dropDatabase=${dropDatabase}`, {
      method: 'DELETE', headers: authHeaders(),
    }));
  },

  // ---- Kullanıcılar (firma alt kullanıcıları) ----
  async listUsers(tenantId: number): Promise<UserDto[]> {
    return handle<UserDto[]>(await apiFetch(`${ADMIN()}/${tenantId}/users`, { headers: authHeaders() }));
  },

  async createUser(tenantId: number, req: CreateUserRequest): Promise<UserDto> {
    return handle<UserDto>(await apiFetch(`${ADMIN()}/${tenantId}/users`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(req),
    }));
  },

  async updateUser(tenantId: number, userId: number, req: UpdateUserRequest): Promise<UserDto> {
    return handle<UserDto>(await apiFetch(`${ADMIN()}/${tenantId}/users/${userId}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify(req),
    }));
  },

  async deleteUser(tenantId: number, userId: number): Promise<void> {
    await handle<string>(await apiFetch(`${ADMIN()}/${tenantId}/users/${userId}`, {
      method: 'DELETE', headers: authHeaders(),
    }));
  },

  // ---- Roller ----
  async listRoles(tenantId: number): Promise<RoleDto[]> {
    return handle<RoleDto[]>(await apiFetch(`${ADMIN()}/${tenantId}/roles`, { headers: authHeaders() }));
  },

  // ---- İzin kataloğu ----
  async listPermissions(): Promise<PermissionDto[]> {
    return handle<PermissionDto[]>(await apiFetch(PERMS(), { headers: authHeaders() }));
  },

  // ================= Firma içi (Firma Sahibi) — kendi firmasının kullanıcı/rolleri =================
  async listMyUsers(): Promise<UserDto[]> {
    return handle<UserDto[]>(await apiFetch(getApiUrl(getEndpoint('ADMIN_USERS')), { headers: authHeaders() }));
  },
  async createMyUser(req: CreateUserRequest): Promise<UserDto> {
    return handle<UserDto>(await apiFetch(getApiUrl(getEndpoint('ADMIN_USERS')), {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(req),
    }));
  },
  async updateMyUser(userId: number, req: UpdateUserRequest): Promise<UserDto> {
    return handle<UserDto>(await apiFetch(`${getApiUrl(getEndpoint('ADMIN_USERS'))}/${userId}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify(req),
    }));
  },
  async deleteMyUser(userId: number): Promise<void> {
    await handle<string>(await apiFetch(`${getApiUrl(getEndpoint('ADMIN_USERS'))}/${userId}`, {
      method: 'DELETE', headers: authHeaders(),
    }));
  },
  async listMyRoles(): Promise<RoleDto[]> {
    return handle<RoleDto[]>(await apiFetch(getApiUrl(getEndpoint('ADMIN_ROLES')), { headers: authHeaders() }));
  },
  async listCouriers(): Promise<UserDto[]> {
    return handle<UserDto[]>(await apiFetch(`${getApiUrl('/api/Admin/couriers')}`, { headers: authHeaders() }));
  },

  // ---- Platform geneli ayarlar (Google Maps anahtarı) — yalnız süperadmin ----
  async getPlatformSettings(): Promise<{ googleMapsApiKey: string | null }> {
    return handle<{ googleMapsApiKey: string | null }>(await apiFetch(getApiUrl(getEndpoint('ADMIN_PLATFORM_SETTINGS')), { headers: authHeaders() }));
  },
  async savePlatformSettings(googleMapsApiKey: string | null): Promise<void> {
    await handle(await apiFetch(getApiUrl(getEndpoint('ADMIN_PLATFORM_SETTINGS')), {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ googleMapsApiKey }),
    }));
  },
};
