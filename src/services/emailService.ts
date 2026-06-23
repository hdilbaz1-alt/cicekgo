import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface EmailSettings {
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: string;      // None | Ssl | StartTls
  smtpUsername: string;
  hasSmtpPassword: boolean;
  imapHost?: string | null;
  imapPort?: number | null;
  imapUsername?: string | null;
  hasImapPassword: boolean;
  sendToRecipient: boolean;
  sendToSender: boolean;
  isVerified: boolean;
  verifiedAtUtc?: string | null;
  dailyLimit: number;
  configured: boolean;
}

export interface UpdateEmailSettings {
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: string;
  smtpUsername: string;
  smtpPassword?: string | null;   // boş → mevcut korunur
  imapHost?: string | null;
  imapPort?: number | null;
  imapUsername?: string | null;
  imapPassword?: string | null;
  sendToRecipient: boolean;
  sendToSender: boolean;
  dailyLimit: number;
}

export const emailService = {
  async getSettings(): Promise<EmailSettings | null> {
    try { const r = await apiFetch(getApiUrl(getEndpoint('EMAIL_SETTINGS'))); const b = await r.json(); return (b?.data as EmailSettings) ?? null; }
    catch { return null; }
  },
  async updateSettings(payload: UpdateEmailSettings): Promise<{ ok: boolean; message?: string; data?: EmailSettings }> {
    try {
      const r = await apiFetch(getApiUrl(getEndpoint('EMAIL_SETTINGS')), { method: 'PUT', body: JSON.stringify(payload) });
      const b = await r.json();
      return { ok: r.ok && b?.success !== false, message: b?.message, data: b?.data };
    } catch { return { ok: false, message: 'Bağlantı hatası' }; }
  },
  async testSettings(): Promise<{ success: boolean; message?: string }> {
    try {
      const r = await apiFetch(getApiUrl(getEndpoint('EMAIL_SETTINGS_TEST')), { method: 'POST' });
      const b = await r.json();
      return { success: !!b?.data?.success, message: b?.message };
    } catch { return { success: false, message: 'Bağlantı hatası' }; }
  },
};
