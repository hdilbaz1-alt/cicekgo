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

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  designJson?: string | null;
  htmlBody: string;
  isActive: boolean;
  createdAtUtc: string;
}
export interface MergeTag { code: string; label: string; insert: string }
export interface EmailTrigger {
  orderStatusId: number;
  statusName: string;
  color?: string | null;
  triggerId?: number | null;
  templateId?: number | null;
  templateName?: string | null;
  isActive: boolean;
}

async function jget<T>(path: string): Promise<T | null> {
  try { const r = await apiFetch(getApiUrl(path)); const b = await r.json(); return (b?.data as T) ?? null; } catch { return null; }
}
async function jsend(path: string, method: string, body?: unknown): Promise<{ ok: boolean; message?: string; data?: unknown }> {
  try { const r = await apiFetch(getApiUrl(path), { method, body: body !== undefined ? JSON.stringify(body) : undefined }); const b = await r.json(); return { ok: r.ok && b?.success !== false, message: b?.message, data: b?.data }; }
  catch { return { ok: false, message: 'Bağlantı hatası' }; }
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

  // Şablonlar
  listTemplates: () => jget<EmailTemplate[]>(getEndpoint('EMAIL_TEMPLATES')).then((r) => r || []),
  createTemplate: (t: { name: string; subject: string; htmlBody: string; designJson?: string | null; isActive: boolean }) =>
    jsend(getEndpoint('EMAIL_TEMPLATES'), 'POST', t),
  updateTemplate: (id: number, t: { name: string; subject: string; htmlBody: string; designJson?: string | null; isActive: boolean }) =>
    jsend(`${getEndpoint('EMAIL_TEMPLATES')}/${id}`, 'PUT', t),
  deleteTemplate: (id: number) => jsend(`${getEndpoint('EMAIL_TEMPLATES')}/${id}`, 'DELETE'),
  preview: async (subject: string, htmlBody: string): Promise<{ subject: string; html: string } | null> => {
    const r = await jsend(getEndpoint('EMAIL_TEMPLATE_PREVIEW'), 'POST', { subject, htmlBody });
    return (r.data as { subject: string; html: string }) ?? null;
  },
  mergeTags: () => jget<MergeTag[]>(getEndpoint('EMAIL_MERGE_TAGS')).then((r) => r || []),

  // Durum eşleştirmeleri
  listTriggers: () => jget<EmailTrigger[]>(getEndpoint('EMAIL_TRIGGERS')).then((r) => r || []),
  setTriggerTemplate: (statusId: number, templateId: number | null) =>
    jsend(`${getEndpoint('EMAIL_TRIGGERS')}/${statusId}/template`, 'PUT', { templateId }),
  setTriggerActive: (statusId: number, isActive: boolean) =>
    jsend(`${getEndpoint('EMAIL_TRIGGERS')}/${statusId}/active`, 'PUT', { isActive }),
};
