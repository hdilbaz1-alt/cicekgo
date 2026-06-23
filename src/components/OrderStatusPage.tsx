'use client';
import { apiFetch } from '@/lib/api';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_URL, ENDPOINTS } from '@/config/api';
import { can, P } from '@/lib/permissions';
import { clearStatusColorCache } from '@/lib/statusColors';
import { GripVertical, Pencil, Trash2, Check, X, Plus } from 'lucide-react';

interface OrderStatus { id: number; statusName: string; color?: string | null; sortOrder: number; isSystem: boolean }

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const PALETTE = ['#64748b', '#3b82f6', '#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#14b8a6', '#84cc16'];
const colorOf = (s: OrderStatus) => s.color || '#64748b';

export default function OrderStatusPage() {
  const [items, setItems] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [colorFor, setColorFor] = useState<number | null>(null);
  const [dragId, setDragIdState] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const canManage = can(P.settingsManage);
  const dragRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await apiFetch(`${BASE_URL}${ENDPOINTS.ORDER_STATUS_LIST}`, { headers: headers() });
      const b = await res.json();
      setItems(b.data || []);
      clearStatusColorCache();
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newName.trim()) return;
    try {
      const res = await apiFetch(`${BASE_URL}${ENDPOINTS.ORDER_STATUS_ADD}`, { method: 'POST', headers: headers(), body: JSON.stringify({ statusName: newName.trim(), color: PALETTE[0] }) });
      if (!res.ok) throw new Error();
      setNewName(''); showToast('Durum eklendi'); load();
    } catch { alert('Eklenemedi'); }
  };
  const update = async (s: OrderStatus, patch: { statusName?: string; color?: string }) => {
    try {
      const res = await apiFetch(`${BASE_URL}${ENDPOINTS.ORDER_STATUS_UPDATE}/${s.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ statusName: patch.statusName ?? s.statusName, color: patch.color ?? s.color }) });
      if (!res.ok) throw new Error();
      load();
    } catch { alert('Güncellenemedi'); }
  };
  const remove = async (s: OrderStatus) => {
    if (s.isSystem) return;
    if (!confirm(`"${s.statusName}" durumunu silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await apiFetch(`${BASE_URL}${ENDPOINTS.ORDER_STATUS_DELETE}/${s.id}`, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error();
      showToast('Silindi'); load();
    } catch { alert('Silinemedi'); }
  };

  const persistOrder = async (list: OrderStatus[]) => {
    try { await apiFetch(`${BASE_URL}${ENDPOINTS.ORDER_STATUS_REORDER}`, { method: 'POST', headers: headers(), body: JSON.stringify({ ids: list.map((x) => x.id) }) }); }
    catch { /* yoksay */ }
  };
  const onDrop = (targetId: number) => {
    const from = dragRef.current;
    dragRef.current = null; setDragIdState(null); setOverId(null);
    if (from == null || from === targetId) return;
    setItems((prev) => {
      const arr = [...prev];
      const fi = arr.findIndex((x) => x.id === from);
      const ti = arr.findIndex((x) => x.id === targetId);
      if (fi < 0 || ti < 0) return prev;
      const [moved] = arr.splice(fi, 1);
      arr.splice(ti, 0, moved);
      persistOrder(arr);
      return arr;
    });
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Sipariş Durumları</h1>
        <p className="text-slate-500 text-sm mb-6">Sürükleyerek sıralayın (dropdown’larda bu sırada görünür), sağdan renk seçin. “İptal Edildi” silinemez.</p>

        {canManage && (
          <div className="flex gap-2 mb-5">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Yeni durum (örn. Hazırlanıyor)"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
            <button onClick={add} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-2xl font-semibold inline-flex items-center gap-1.5"><Plus className="w-4 h-4" />Ekle</button>
          </div>
        )}

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {items.map((s) => (
              <div key={s.id}
                draggable={canManage}
                onDragStart={(e) => { dragRef.current = s.id; setDragIdState(s.id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(s.id)); } catch { /* */ } }}
                onDragEnter={(e) => { e.preventDefault(); if (dragRef.current != null && dragRef.current !== s.id) setOverId(s.id); }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDragLeave={() => setOverId((cur) => (cur === s.id ? null : cur))}
                onDrop={() => onDrop(s.id)}
                onDragEnd={() => { dragRef.current = null; setDragIdState(null); setOverId(null); }}
                className={`bg-white rounded-2xl border shadow-sm p-3.5 flex items-center gap-3 select-none transition-all
                  ${dragId === s.id ? 'opacity-40' : 'opacity-100'}
                  ${overId === s.id ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
                {canManage && <GripVertical className="w-5 h-5 text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />}
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: colorOf(s) }} />
                {editId === s.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') { update(s, { statusName: editName.trim() }); setEditId(null); } }} />
                ) : (
                  <span className="flex-1 min-w-0 inline-flex items-center gap-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full truncate" style={{ background: colorOf(s) + '22', color: colorOf(s) }}>{s.statusName}</span>
                    {s.isSystem && <span className="text-[10px] text-slate-400">sistem</span>}
                  </span>
                )}

                {canManage && (
                  <div className="flex items-center gap-1 shrink-0 relative">
                    {editId === s.id ? (
                      <>
                        <button onClick={() => { update(s, { statusName: editName.trim() }); setEditId(null); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setColorFor(colorFor === s.id ? null : s.id)} title="Renk" className="w-8 h-8 rounded-xl border border-slate-200 shrink-0" style={{ background: colorOf(s) }} />
                        {!s.isSystem && <button onClick={() => { setEditId(s.id); setEditName(s.statusName); }} title="Düzenle" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Pencil className="w-4 h-4" /></button>}
                        {!s.isSystem && <button onClick={() => remove(s)} title="Sil" className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>}
                        {colorFor === s.id && (
                          <div className="fixed inset-0 z-10" onClick={() => setColorFor(null)} />
                        )}
                        {colorFor === s.id && (
                          <div className="absolute right-0 top-10 z-20 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 w-56" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-6 gap-2 mb-2">
                              {PALETTE.map((c) => (
                                <button key={c} onClick={() => { update(s, { color: c }); setColorFor(null); }} className="w-7 h-7 rounded-lg border border-slate-200" style={{ background: c }} />
                              ))}
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-500">
                              Özel: <input type="color" defaultValue={colorOf(s)} onChange={(e) => update(s, { color: e.target.value })} className="w-8 h-6 rounded" />
                            </label>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">Durum yok.</div>}
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}
