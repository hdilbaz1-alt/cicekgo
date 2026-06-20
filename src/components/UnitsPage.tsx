'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { productService, UnitDto } from '@/services/productService';
import { can, P } from '@/lib/permissions';

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const canManage = can(P.settingsManage);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setUnits(await productService.units()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({ total: units.length, active: units.filter((u) => u.isActive).length }), [units]);

  const add = async () => {
    if (!newName.trim()) return;
    try { await productService.createUnit(newName.trim(), units.length + 1); setNewName(''); showToast('Birim eklendi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Eklenemedi'); }
  };
  const saveEdit = async (u: UnitDto) => {
    try { await productService.updateUnit(u.id, { name: editName.trim() || u.name, sortOrder: u.sortOrder, isActive: u.isActive }); setEditId(null); showToast('Güncellendi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Güncellenemedi'); }
  };
  const toggle = async (u: UnitDto) => {
    try { await productService.updateUnit(u.id, { name: u.name, sortOrder: u.sortOrder, isActive: !u.isActive }); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Güncellenemedi'); }
  };
  const remove = async (u: UnitDto) => {
    if (!confirm(`"${u.name}" birimini silmek istediğinize emin misiniz?`)) return;
    try { await productService.deleteUnit(u.id); showToast('Silindi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Silinemedi'); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Birim Ayarları</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-7 max-w-md">
          <StatCard label="Toplam Birim" value={stats.total} grad="from-blue-500 to-indigo-600" icon="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" />
          <StatCard label="Aktif" value={stats.active} grad="from-emerald-500 to-teal-600" icon="M5 13l4 4L19 7" />
        </div>

        {canManage && (
          <div className="flex gap-2 mb-5 max-w-lg">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Yeni birim adı (örn. Kg)"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
            <button onClick={add} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 active:scale-95 transition-all">Ekle</button>
          </div>
        )}

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/70 border border-slate-100 animate-pulse" />)}
          </div>
        ) : units.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">Birim yok.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-3">
                {editId === u.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(u); }} />
                ) : (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${u.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`font-medium truncate ${u.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{u.name}</span>
                  </div>
                )}
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0 text-sm">
                    {editId === u.id ? (
                      <>
                        <button onClick={() => saveEdit(u)} className="text-blue-600 font-medium px-2">Kaydet</button>
                        <button onClick={() => setEditId(null)} className="text-slate-400 px-2">İptal</button>
                      </>
                    ) : (
                      <>
                        <IconBtn title={u.isActive ? 'Pasifleştir' : 'Aktifleştir'} onClick={() => toggle(u)} cls="text-amber-500 hover:bg-amber-50"
                          path={u.isActive ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M5 13l4 4L19 7'} />
                        <IconBtn title="Düzenle" onClick={() => { setEditId(u.id); setEditName(u.name); }} cls="text-blue-600 hover:bg-blue-50"
                          path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        <IconBtn title="Sil" onClick={() => remove(u)} cls="text-red-500 hover:bg-red-50"
                          path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, grad, icon }: { label: string; value: number; grad: string; icon: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shrink-0`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function IconBtn({ title, onClick, cls, path }: { title: string; onClick: () => void; cls: string; path: string }) {
  return (
    <button title={title} onClick={onClick} className={`p-2 rounded-xl transition-colors ${cls}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
    </button>
  );
}
