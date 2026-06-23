import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface Province {
  id: number;
  plateCode: number;
  name: string;
}

export interface District {
  id: number;
  provinceId: number;
  name: string;
}

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const PROV_KEY = 'cg_provinces';
const distKey = (id: number) => `cg_districts_${id}`;

function readCache<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function writeCache(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* yoksay */ }
}

export const locationService = {
  /** İlleri getirir (localStorage'de önbellekli; referans verisi nadiren değişir). */
  async getProvinces(): Promise<Province[]> {
    const cached = readCache<Province[]>(PROV_KEY);
    if (cached && cached.length) return cached;
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('LOCATION_PROVINCES')), { headers: auth() });
      const b = await res.json();
      const list = (b.success ? (b.data as Province[]) : []) || [];
      if (list.length) writeCache(PROV_KEY, list);
      return list;
    } catch { return cached || []; }
  },

  /** Bir ile ait ilçeleri getirir (il başına önbellekli). */
  async getDistricts(provinceId: number): Promise<District[]> {
    if (!provinceId) return [];
    const cached = readCache<District[]>(distKey(provinceId));
    if (cached && cached.length) return cached;
    try {
      const res = await apiFetch(`${getApiUrl(getEndpoint('LOCATION_DISTRICTS'))}?provinceId=${provinceId}`, { headers: auth() });
      const b = await res.json();
      const list = (b.success ? (b.data as District[]) : []) || [];
      if (list.length) writeCache(distKey(provinceId), list);
      return list;
    } catch { return cached || []; }
  },
};
