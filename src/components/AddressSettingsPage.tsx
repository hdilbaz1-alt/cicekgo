'use client';

import { useEffect, useState } from 'react';
import { locationService, Province, District } from '@/services/locationService';
import { Home } from 'lucide-react';

interface DefaultAddress { provinceId?: number; districtId?: number; provinceName?: string; districtName?: string }

function userId(): string {
  try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return String(u.userId ?? u.id ?? ''); } catch { return ''; }
}
const defKey = () => `cg_default_address_${userId()}`;

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';

export default function AddressSettingsPage() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  // ── Bölüm A: Varsayılan Adres (localStorage) ──
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinceId, setProvinceId] = useState<number | ''>('');
  const [districtId, setDistrictId] = useState<number | ''>('');

  useEffect(() => { locationService.getProvinces().then(setProvinces).catch(() => { }); }, []);
  // ilk yükleme: kayıtlı varsayılanı uygula
  useEffect(() => {
    if (provinces.length === 0) return;
    try {
      const raw = localStorage.getItem(defKey());
      if (!raw) return;
      const d = JSON.parse(raw) as DefaultAddress;
      if (d.provinceId) setProvinceId(d.provinceId);
    } catch { /* yoksay */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces]);
  useEffect(() => {
    if (provinceId === '') { setDistricts([]); return; }
    locationService.getDistricts(Number(provinceId)).then((list) => {
      setDistricts(list);
      try {
        const raw = localStorage.getItem(defKey());
        if (raw) { const d = JSON.parse(raw) as DefaultAddress; if (d.districtId && list.some((x) => x.id === d.districtId)) setDistrictId(d.districtId); }
      } catch { /* yoksay */ }
    }).catch(() => setDistricts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId]);

  const saveDefault = () => {
    const pName = provinces.find((p) => p.id === provinceId)?.name;
    const dName = districts.find((d) => d.id === districtId)?.name;
    const payload: DefaultAddress = { provinceId: provinceId || undefined, districtId: districtId || undefined, provinceName: pName, districtName: dName };
    localStorage.setItem(defKey(), JSON.stringify(payload));
    showToast('Varsayılan adres kaydedildi');
  };
  const clearDefault = () => { localStorage.removeItem(defKey()); setProvinceId(''); setDistrictId(''); showToast('Varsayılan adres temizlendi'); };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8 max-w-[900px]">
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Varsayılan Adres</h1>
          <p className="text-slate-500 text-sm mt-1">Yeni siparişlerde İl/İlçe otomatik dolu gelsin.</p>
        </div>

        {/* Bölüm A */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2"><Home className="w-4 h-4 text-indigo-600" /> Varsayılan Adres</h3>
          <p className="text-xs text-slate-400 mb-4">Yeni sipariş ekranı açıldığında İl (ve seçtiyseniz İlçe) otomatik dolu gelir. Bu cihazda saklanır.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Varsayılan İl</label>
              <select className={inputCls + ' mt-1'} value={provinceId}
                onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setProvinceId(v); setDistrictId(''); }}>
                <option value="">Seçilmedi</option>
                {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Varsayılan İlçe (opsiyonel)</label>
              <select className={inputCls + ' mt-1'} value={districtId} disabled={provinceId === ''}
                onChange={(e) => setDistrictId(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">{provinceId === '' ? 'Önce il seçin' : 'Seçilmedi'}</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={saveDefault} disabled={provinceId === ''} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">Kaydet</button>
            <button onClick={clearDefault} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">Temizle</button>
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}
