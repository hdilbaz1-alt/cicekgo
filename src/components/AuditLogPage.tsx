'use client';

import { useCallback, useEffect, useState } from 'react';
import { BASE_URL, ENDPOINTS } from '@/config/api';

interface AuditLog {
  id: number; userId?: number | null; userFullName?: string | null; actionType: string;
  moduleName?: string | null; entityType?: string | null; entityId?: string | null;
  description?: string | null; ipAddress?: string | null; createdAt: string;
}

const fmt = (d: string) => new Date(d).toLocaleString('tr-TR');
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'STATUS_CHANGE', 'LOGIN', 'ACCESS_DENIED'];
const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Oluşturma', UPDATE: 'Güncelleme', DELETE: 'Silme', RESTORE: 'Geri Yükleme',
  STATUS_CHANGE: 'Durum', LOGIN: 'Giriş', ACCESS_DENIED: 'Erişim Reddi',
};
const actionColor = (a: string) => {
  switch (a) {
    case 'CREATE': return 'bg-emerald-100 text-emerald-700';
    case 'UPDATE': case 'STATUS_CHANGE': return 'bg-blue-100 text-blue-700';
    case 'DELETE': return 'bg-red-100 text-red-700';
    case 'RESTORE': return 'bg-amber-100 text-amber-700';
    case 'ACCESS_DENIED': return 'bg-rose-100 text-rose-700';
    case 'LOGIN': return 'bg-slate-100 text-slate-600';
    default: return 'bg-slate-100 text-slate-600';
  }
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function Spinner() {
  return <div className="flex justify-center py-16"><svg className="w-8 h-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg></div>;
}

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState('week');
  const pageSize = 50;

  const range = useCallback(() => {
    const now = new Date();
    if (preset === 'today') return { startDate: iso(now), endDate: iso(now) };
    if (preset === 'week') { const a = new Date(now); a.setDate(now.getDate() - 6); return { startDate: iso(a), endDate: iso(now) }; }
    if (preset === 'month') return { startDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: iso(now) };
    return {};
  }, [preset]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}${ENDPOINTS.AUDIT_LIST}`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ ...range(), actionType: action || null, search: search || null, page, pageSize }),
      });
      const b = await res.json();
      if (b.success) { setItems(b.data.items || []); setTotal(b.data.totalCount || 0); }
    } catch { setItems([]); setTotal(0); }
    finally { setLoading(false); }
  }, [range, action, search, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [preset, action, search]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">İşlem Kayıtları</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          {[['today', 'Bugün'], ['week', 'Hafta'], ['month', 'Ay'], ['all', 'Tümü']].map(([k, l]) => (
            <button key={k} onClick={() => setPreset(k)} className={`px-4 py-2 rounded-2xl text-sm font-medium ${preset === k ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{l}</button>
          ))}
          <select value={action} onChange={(e) => setAction(e.target.value)} className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600">
            {ACTIONS.map((a) => <option key={a} value={a}>{a === '' ? 'Tüm işlemler' : ACTION_LABEL[a] || a}</option>)}
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara (kullanıcı, açıklama)…" className="flex-1 min-w-[200px] px-4 py-2 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? <Spinner /> : items.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Kayıt yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr><th className="px-4 py-3 font-medium">Tarih</th><th className="px-4 py-3 font-medium">İşlem</th><th className="px-4 py-3 font-medium">Kullanıcı</th><th className="px-4 py-3 font-medium">Modül</th><th className="px-4 py-3 font-medium">Açıklama</th><th className="px-4 py-3 font-medium">IP</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmt(a.createdAt)}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${actionColor(a.actionType)}`}>{ACTION_LABEL[a.actionType] || a.actionType}</span></td>
                      <td className="px-4 py-2.5 text-slate-700">{a.userFullName || (a.userId ? `#${a.userId}` : 'Sistem')}</td>
                      <td className="px-4 py-2.5 text-slate-500">{a.moduleName || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.description || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{a.ipAddress || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && total > pageSize && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-slate-500">Toplam {total} kayıt · Sayfa {page}/{pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 disabled:opacity-40">Önceki</button>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 disabled:opacity-40">Sonraki</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
