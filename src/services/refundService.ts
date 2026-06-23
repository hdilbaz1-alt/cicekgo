import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface RefundDto {
  id: number;
  orderId: number;
  orderCode: string;
  customerId: number | null;
  customerName?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  amount: number;
  refundedAmount: number;
  remaining: number;
  status: 'PENDING' | 'PARTIAL' | 'DONE' | 'CANCELLED';
  reason?: string | null;
  plannedDate?: string | null;
  createdAt: string;
  createdBy?: string | null;
  completedAt?: string | null;
  note?: string | null;
}

export interface RefundSummary { pendingCount: number; pendingTotal: number }

const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const refundService = {
  async list(opts?: { customerId?: number; onlyOpen?: boolean }): Promise<RefundDto[]> {
    const p = new URLSearchParams();
    if (opts?.customerId) p.set('customerId', String(opts.customerId));
    if (opts?.onlyOpen) p.set('onlyOpen', 'true');
    const res = await apiFetch(`${getApiUrl(getEndpoint('REFUND_LIST'))}?${p}`, { headers: auth() });
    const b = await res.json();
    return b.success ? (b.data as RefundDto[]) : [];
  },

  async search(opts: { q?: string; nonCariOnly?: boolean; onlyOpen?: boolean }): Promise<RefundDto[]> {
    const p = new URLSearchParams();
    if (opts.q) p.set('q', opts.q);
    if (opts.nonCariOnly) p.set('nonCariOnly', 'true');
    if (opts.onlyOpen) p.set('onlyOpen', 'true');
    const res = await apiFetch(`${getApiUrl(getEndpoint('REFUND_SEARCH'))}?${p}`, { headers: auth() });
    const b = await res.json();
    return b.success ? (b.data as RefundDto[]) : [];
  },

  async summary(): Promise<RefundSummary> {
    const res = await apiFetch(getApiUrl(getEndpoint('REFUND_SUMMARY')), { headers: auth() });
    const b = await res.json();
    return b.success ? b.data : { pendingCount: 0, pendingTotal: 0 };
  },

  async process(id: number, body: { amount?: number | null; note?: string; refundDate?: string; paymentMethodId?: number }): Promise<RefundDto> {
    const res = await apiFetch(`${getApiUrl(getEndpoint('REFUND_PROCESS'))}/${id}/process`, {
      method: 'POST', headers: auth(), body: JSON.stringify(body),
    });
    const b = await res.json();
    if (!res.ok || b.success === false) throw new Error(b.message || 'İade işlenemedi');
    return b.data as RefundDto;
  },

  // Bekleyen iadeyi kasa/ödeme kaydı OLUŞTURMADAN "ödendi" kapatır (ödeme başka yolla yapıldıysa).
  async resolve(id: number, note?: string): Promise<RefundDto> {
    const res = await apiFetch(`${getApiUrl(getEndpoint('REFUND_PROCESS'))}/${id}/resolve`, {
      method: 'POST', headers: auth(), body: JSON.stringify({ note: note || null }),
    });
    const b = await res.json();
    if (!res.ok || b.success === false) throw new Error(b.message || 'İade kapatılamadı');
    return b.data as RefundDto;
  },
};
