import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface GeneralSummary {
  totalSales: number; totalCollected: number; openReceivables: number;
  cashIn: number; cashOut: number; expenseTotal: number; netCash: number; orderCount: number;
}
export interface CashMovement {
  id: number; movementType: string; direction: string; amount: number;
  paymentMethod?: string | null; description?: string | null; transactionDate: string;
}
export interface Expense {
  id: number; category: string; amount: number; paymentMethod?: string | null;
  description?: string | null; transactionDate: string; createdByUserName?: string | null;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || (body && body.success === false)) throw new Error(body?.message || `HTTP ${res.status}`);
  return body.data as T;
}
const qs = (from?: string, to?: string) => {
  const p = new URLSearchParams();
  if (from) p.set('from', from); if (to) p.set('to', to);
  const s = p.toString(); return s ? `?${s}` : '';
};

export const financeService = {
  async summary(from?: string, to?: string): Promise<GeneralSummary> {
    return handle<GeneralSummary>(await apiFetch(getApiUrl(getEndpoint('CASH_SUMMARY')) + qs(from, to), { headers: authHeaders() }));
  },
  async cashMovements(from?: string, to?: string): Promise<CashMovement[]> {
    return handle<CashMovement[]>(await apiFetch(getApiUrl(getEndpoint('CASH_MOVEMENTS')) + qs(from, to), { headers: authHeaders() }));
  },
  async expenses(from?: string, to?: string): Promise<Expense[]> {
    return handle<Expense[]>(await apiFetch(getApiUrl(getEndpoint('EXPENSE_LIST')) + qs(from, to), { headers: authHeaders() }));
  },
  async addExpense(e: { category: string; amount: number; paymentMethod?: string; description?: string }): Promise<number> {
    return handle<number>(await apiFetch(getApiUrl(getEndpoint('EXPENSE')), { method: 'POST', headers: authHeaders(), body: JSON.stringify(e) }));
  },
  async deleteExpense(id: number): Promise<void> {
    await handle<string>(await apiFetch(`${getApiUrl(getEndpoint('EXPENSE'))}/${id}`, { method: 'DELETE', headers: authHeaders() }));
  },
};
