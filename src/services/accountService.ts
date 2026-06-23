import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface AccountMe {
  userId: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
  tenantName?: string | null;
  createdAtUtc: string;
  lastLoginAtUtc?: string | null;
  lkStart?: string | null;
  lkEnd?: string | null;
  roles: string[];
  permissions: string[];
}

export const accountService = {
  async me(): Promise<AccountMe | null> {
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('ACCOUNT_ME')));
      const b = await res.json();
      return (b?.data as AccountMe) ?? null;
    } catch { return null; }
  },

  async updateProfile(payload: { fullName?: string | null; email?: string | null }): Promise<{ ok: boolean; message?: string; data?: AccountMe }> {
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('ACCOUNT_PROFILE')), { method: 'PUT', body: JSON.stringify(payload) });
      const b = await res.json();
      return { ok: res.ok && b?.success !== false, message: b?.message, data: b?.data };
    } catch { return { ok: false, message: 'Bağlantı hatası' }; }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('ACCOUNT_CHANGE_PASSWORD')), {
        method: 'POST', body: JSON.stringify({ currentPassword, newPassword }),
      });
      const b = await res.json();
      return { ok: res.ok && b?.success !== false, message: b?.message };
    } catch { return { ok: false, message: 'Bağlantı hatası' }; }
  },
};
