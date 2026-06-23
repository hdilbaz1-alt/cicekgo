'use client';
import { apiFetch } from '@/lib/api';

import { useCallback, useEffect, useState } from 'react';
import { getApiUrl, getEndpoint } from '@/config/api';
import { can, P } from '@/lib/permissions';

interface StoreSettings { openTime: string; closeTime: string; slotMinutes: number; deliverySlots: string[] }

export default function StoreHoursPage() {
  const [s, setS] = useState<StoreSettings>({ openTime: '09:00', closeTime: '18:00', slotMinutes: 30, deliverySlots: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const canManage = can(P.settingsManage);

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('STORE_SETTINGS')), { headers: headers() });
      const body = await res.json();
      if (body.success) setS(body.data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('STORE_SETTINGS')), {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ openTime: s.openTime, closeTime: s.closeTime, slotMinutes: s.slotMinutes }),
      });
      const body = await res.json();
      if (!res.ok || body.success === false) throw new Error(body.message || 'Kaydedilemedi');
      setS(body.data);
      setToast('Çalışma saatleri kaydedildi'); setTimeout(() => setToast(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : 'Kaydedilemedi'); }
    finally { setBusy(false); }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8 max-w-[900px]">
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Çalışma Saatleri</h1>
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <div className="h-40 rounded-3xl bg-white/70 border border-slate-100 animate-pulse" />
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Ayarlar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-slate-600">Açılış</label><input type="time" disabled={!canManage} className={inputCls + ' mt-1 disabled:opacity-60'} value={s.openTime} onChange={(e) => setS({ ...s, openTime: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Kapanış</label><input type="time" disabled={!canManage} className={inputCls + ' mt-1 disabled:opacity-60'} value={s.closeTime} onChange={(e) => setS({ ...s, closeTime: e.target.value })} /></div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600">Slot Süresi (dakika)</label>
                  <select disabled={!canManage} className={inputCls + ' mt-1 disabled:opacity-60'} value={s.slotMinutes} onChange={(e) => setS({ ...s, slotMinutes: Number(e.target.value) })}>
                    {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} dk</option>)}
                  </select>
                </div>
              </div>
              {canManage && (
                <button onClick={save} disabled={busy} className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-1">Teslimat Saat Aralıkları</h3>
              <p className="text-xs text-slate-400 mb-4">{s.deliverySlots.length} aralık · sipariş ekranında dropdown olarak görünür</p>
              <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
                {s.deliverySlots.map((slot) => (
                  <span key={slot} className="text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">{slot}</span>
                ))}
                {s.deliverySlots.length === 0 && <span className="text-sm text-slate-400">Aralık yok.</span>}
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}
