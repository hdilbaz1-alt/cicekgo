import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface PaymentMethodDto {
  id: number;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const paymentMethodService = {
  async list(): Promise<PaymentMethodDto[]> {
    const res = await apiFetch(getApiUrl(getEndpoint('PAYMENT_METHOD_LIST')), { headers: auth() });
    const b = await res.json();
    return b.success ? (b.data as PaymentMethodDto[]) : [];
  },
  async add(name: string): Promise<void> {
    const res = await apiFetch(getApiUrl(getEndpoint('PAYMENT_METHOD_ADD')), { method: 'POST', headers: auth(), body: JSON.stringify({ name, isActive: true }) });
    if (!res.ok) throw new Error('Eklenemedi');
  },
  async update(id: number, name: string, isActive: boolean): Promise<void> {
    const res = await apiFetch(`${getApiUrl(getEndpoint('PAYMENT_METHOD_UPDATE'))}/${id}`, { method: 'PUT', headers: auth(), body: JSON.stringify({ name, isActive }) });
    if (!res.ok) throw new Error('Güncellenemedi');
  },
  async remove(id: number): Promise<void> {
    const res = await apiFetch(`${getApiUrl(getEndpoint('PAYMENT_METHOD_DELETE'))}/${id}`, { method: 'DELETE', headers: auth() });
    if (!res.ok) throw new Error('Silinemedi');
  },
  async setDefault(id: number): Promise<void> {
    const res = await apiFetch(`${getApiUrl(getEndpoint('PAYMENT_METHOD_SET_DEFAULT'))}/${id}`, { method: 'POST', headers: auth() });
    if (!res.ok) throw new Error('Ayarlanamadı');
  },
};
