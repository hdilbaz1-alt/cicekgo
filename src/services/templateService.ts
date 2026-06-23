import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface PrintTemplate {
  id: number;
  name: string;
  templateType: string;
  paperType: string;        // A4 / A5
  rotation: string;
  theme: string;
  style: string;
  isDefault: boolean;
  showOrderCode: boolean;
  showCreatedDate: boolean;
  showPrice: boolean;
  showPaymentStatus: boolean;
  showExtraNote: boolean;
  showRecipientPhone: boolean;
  showSenderPhone: boolean;
  showQr: boolean;
  noteFont: string;
  noteBold: boolean;
  noteFontStyle: string;    // Normal / Italic / Script
  noteFontSize: number;
  noteColor: string;
  cardSize: string;
  noteContent: string;
  elementsJson?: string | null;
}

export type PrintTemplateSave = Omit<PrintTemplate, 'id'>;

const authHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};
async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || (body && body.success === false)) throw new Error(body?.message || `HTTP ${res.status}`);
  return body.data as T;
}

export const templateService = {
  async list(): Promise<PrintTemplate[]> {
    return handle<PrintTemplate[]>(await apiFetch(getApiUrl(getEndpoint('PRINT_TEMPLATE_LIST')), { headers: authHeaders() }));
  },
  async create(t: PrintTemplateSave): Promise<number> {
    return handle<number>(await apiFetch(getApiUrl(getEndpoint('PRINT_TEMPLATE')), { method: 'POST', headers: authHeaders(), body: JSON.stringify(t) }));
  },
  async update(id: number, t: PrintTemplateSave): Promise<void> {
    await handle(await apiFetch(`${getApiUrl(getEndpoint('PRINT_TEMPLATE'))}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(t) }));
  },
  async remove(id: number): Promise<void> {
    await handle(await apiFetch(`${getApiUrl(getEndpoint('PRINT_TEMPLATE'))}/${id}`, { method: 'DELETE', headers: authHeaders() }));
  },
  async setDefault(id: number): Promise<void> {
    await handle(await apiFetch(`${getApiUrl(getEndpoint('PRINT_TEMPLATE'))}/${id}/default`, { method: 'POST', headers: authHeaders() }));
  },
};

export const DEFAULT_TEMPLATE: PrintTemplateSave = {
  name: 'Varsayılan Şablon', templateType: 'Standart A4/A5', paperType: 'A5', rotation: 'Normal',
  theme: 'Tema 1', style: 'Stil 1', isDefault: false,
  showOrderCode: true, showCreatedDate: true, showPrice: true, showPaymentStatus: true,
  showExtraNote: true, showRecipientPhone: true, showSenderPhone: true, showQr: true,
  noteFont: 'Varsayılan', noteBold: false, noteFontStyle: 'Normal', noteFontSize: 18,
  noteColor: '#333333', cardSize: 'Büyük Kart', noteContent: '{{kart_notu}}',
};
