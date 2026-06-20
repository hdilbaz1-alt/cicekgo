// Anlamsal durum renkleri — Ayarlar'dan gelen ÖZEL durum adları da
// anahtar kelimeye göre tutarlı renk alsın diye substring eşleştirmesi yapılır.

import { getApiUrl, getEndpoint } from '@/config/api';

// Ayarlar > Sipariş Durumları'nda seçilen özel renkler (ad → hex) önbelleği
let _statusColorCache: Record<string, string> | null = null;
let _statusColorInflight: Promise<Record<string, string>> | null = null;

export async function loadStatusColorMap(force = false): Promise<Record<string, string>> {
  if (_statusColorCache && !force) return _statusColorCache;
  if (!_statusColorInflight || force) {
    _statusColorInflight = (async () => {
      try {
        const res = await fetch(getApiUrl(getEndpoint('ORDER_STATUS_LIST')), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const b = await res.json();
        const map: Record<string, string> = {};
        for (const s of (b.data || [])) if (s.statusName && s.color) map[s.statusName] = s.color;
        _statusColorCache = map;
        return map;
      } catch { _statusColorCache = {}; return {}; }
      finally { _statusColorInflight = null; }
    })();
  }
  return _statusColorInflight;
}
export function clearStatusColorCache() { _statusColorCache = null; }

export type Tone = 'green' | 'amber' | 'indigo' | 'blue' | 'red' | 'purple' | 'slate';

const STATUS_TONE: Record<Tone, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  slate: 'bg-slate-100 text-slate-600',
};

const PAY_TONE: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  blue: 'bg-blue-50 text-blue-700',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-700',
  slate: 'bg-slate-50 text-slate-600',
};

const lc = (s?: string | null) => (s || '').toLocaleLowerCase('tr');

export function statusTone(s?: string | null): Tone {
  const t = lc(s);
  if (!t) return 'slate';
  if (/iptal|silin|redded|iade|başarısız/.test(t)) return 'red';
  if (/teslim ed|tamamlan|tamamland|kapand/.test(t)) return 'green';
  if (/yol|kurye|sevk|çıkış|cikis|dağıt|dagit|gönder|gonder/.test(t)) return 'indigo';
  if (/hazırlan|hazirlan|hazırlık|hazirlik|paketlen/.test(t)) return 'amber';
  if (/hazır|hazir|onayl/.test(t)) return 'blue';
  if (/bekle|beklemede|yeni|alınd|alind|oluştur|olustur/.test(t)) return 'slate';
  return 'slate';
}

export function payTone(s?: string | null): Tone {
  const t = lc(s);
  if (!t) return 'red';
  if (/ödendi|odendi|tahsil/.test(t)) return 'green';
  if (/kısmi|kismi|parça|parca/.test(t)) return 'amber';
  if (/veresiye/.test(t)) return 'purple';
  if (/ödenmedi|odenmedi|bekle/.test(t)) return 'red';
  return 'red';
}

export const statusColor = (s?: string | null) => STATUS_TONE[statusTone(s)];
export const payColor = (s?: string | null) => PAY_TONE[payTone(s)];
