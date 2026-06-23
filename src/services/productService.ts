import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface ProductDto {
  id: number;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  description?: string | null;
  salePrice: number;
  purchasePrice?: number | null;
  vatRate?: number | null;
  trackStock: boolean;
  currentStock: number;
  criticalStockLevel: number;
  unit?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface ProductCategoryDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface UnitDto {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface StockMovementDto {
  id: number;
  productId: number;
  productName: string;
  movementType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  description?: string | null;
  createdByUserName?: string | null;
  createdAt: string;
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

const PRODUCT = () => getApiUrl(getEndpoint('PRODUCT'));
const CATEGORIES = () => getApiUrl(getEndpoint('PRODUCT_CATEGORIES'));
const STOCK = () => getApiUrl(getEndpoint('STOCK_MOVEMENTS'));

export const productService = {
  async list(search?: string): Promise<ProductDto[]> {
    const url = `${getApiUrl(getEndpoint('PRODUCT_LIST'))}${search ? `?search=${encodeURIComponent(search)}` : ''}`;
    return handle<ProductDto[]>(await apiFetch(url, { headers: authHeaders() }));
  },
  async create(p: Partial<ProductDto>): Promise<number> {
    return handle<number>(await apiFetch(PRODUCT(), { method: 'POST', headers: authHeaders(), body: JSON.stringify(p) }));
  },
  async update(id: number, p: Partial<ProductDto>): Promise<void> {
    await handle<string>(await apiFetch(`${PRODUCT()}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(p) }));
  },
  async remove(id: number): Promise<void> {
    await handle<string>(await apiFetch(`${PRODUCT()}/${id}`, { method: 'DELETE', headers: authHeaders() }));
  },

  async categories(): Promise<ProductCategoryDto[]> {
    return handle<ProductCategoryDto[]>(await apiFetch(CATEGORIES(), { headers: authHeaders() }));
  },
  async createCategory(name: string): Promise<number> {
    return handle<number>(await apiFetch(CATEGORIES(), { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name, isActive: true }) }));
  },
  async deleteCategory(id: number): Promise<void> {
    await handle<string>(await apiFetch(`${CATEGORIES()}/${id}`, { method: 'DELETE', headers: authHeaders() }));
  },

  async movements(productId?: number): Promise<StockMovementDto[]> {
    const url = `${STOCK()}${productId ? `?productId=${productId}` : ''}`;
    return handle<StockMovementDto[]>(await apiFetch(url, { headers: authHeaders() }));
  },
  async addMovement(m: { productId: number; movementType: string; quantity: number; description?: string }): Promise<number> {
    return handle<number>(await apiFetch(STOCK(), { method: 'POST', headers: authHeaders(), body: JSON.stringify(m) }));
  },
  async critical(): Promise<ProductDto[]> {
    return handle<ProductDto[]>(await apiFetch(getApiUrl(getEndpoint('STOCK_CRITICAL')), { headers: authHeaders() }));
  },

  // ---- Birimler ----
  async units(): Promise<UnitDto[]> {
    return handle<UnitDto[]>(await apiFetch(getApiUrl(getEndpoint('UNIT_LIST')), { headers: authHeaders() }));
  },
  async createUnit(name: string, sortOrder = 0): Promise<number> {
    return handle<number>(await apiFetch(getApiUrl(getEndpoint('UNIT')), { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name, sortOrder, isActive: true }) }));
  },
  async updateUnit(id: number, req: { name: string; sortOrder: number; isActive: boolean }): Promise<void> {
    await handle<string>(await apiFetch(`${getApiUrl(getEndpoint('UNIT'))}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(req) }));
  },
  async deleteUnit(id: number): Promise<void> {
    await handle<string>(await apiFetch(`${getApiUrl(getEndpoint('UNIT'))}/${id}`, { method: 'DELETE', headers: authHeaders() }));
  },
};
