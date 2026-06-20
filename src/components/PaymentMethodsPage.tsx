'use client';

import { useCallback, useEffect, useState } from 'react';
import { paymentMethodService, PaymentMethodDto } from '@/services/paymentMethodService';
import { clearPaymentMethodCache } from './PaymentMethodSelect';
import { can, P } from '@/lib/permissions';
import { Plus, Star, Pencil, Trash2, Check, X } from 'lucide-react';

export default function PaymentMethodsPage() {
  const [list, setList] = useState<PaymentMethodDto[]>([]);
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
    try { setList(await paymentMethodService.list()); clearPaymentMethodCache(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newName.trim()) return;
    try { await paymentMethodService.add(newName.trim()); setNewName(''); showToast('Eklendi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Eklenemedi'); }
  };
  const saveEdit = async (m: PaymentMethodDto) => {
    try { await paymentMethodService.update(m.id, editName.trim() || m.name, m.isActive); setEditId(null); showToast('Güncellendi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Güncellenemedi'); }
  };
  const toggle = async (m: PaymentMethodDto) => {
    try { await paymentMethodService.update(m.id, m.name, !m.isActive); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Güncellenemedi'); }
  };
  const setDefault = async (m: PaymentMethodDto) => {
    try { await paymentMethodService.setDefault(m.id); showToast(`Varsayılan: ${m.name}`); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Ayarlanamadı'); }
  };
  const remove = async (m: PaymentMethodDto) => {
    if (!confirm(`"${m.name}" ödeme yöntemini silmek istediğinize emin misiniz?`)) return;
    try { await paymentMethodService.remove(m.id); showToast('Silindi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Silinemedi'); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Ödeme Yöntemleri</h1>
        <p className="text-slate-500 text-sm mb-6">Tahsilat ve iadelerde kullanılır. Varsayılan, formlarda otomatik seçilir.</p>

        {canManage && (
          <div className="flex gap-2 mb-5">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Yeni yöntem (örn. POS)"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
            <button onClick={add} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-2xl font-semibold inline-flex items-center gap-1.5"><Plus className="w-4 h-4" />Ekle</button>
          </div>
        )}

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {list.map((m) => (
              <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 ${m.isActive ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}>
                {editId === m.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m); }} />
                ) : (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-medium text-slate-800 truncate">{m.name}</span>
                    {m.isDefault && <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Star className="w-3 h-3" />Varsayılan</span>}
                    {!m.isActive && <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">pasif</span>}
                  </div>
                )}
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0 text-sm">
                    {editId === m.id ? (
                      <>
                        <button onClick={() => saveEdit(m)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        {!m.isDefault && m.isActive && <button onClick={() => setDefault(m)} title="Varsayılan yap" className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl"><Star className="w-4 h-4" /></button>}
                        <button onClick={() => toggle(m)} title={m.isActive ? 'Pasifleştir' : 'Aktifleştir'} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">{m.isActive ? 'Pasif' : 'Aktif'}</button>
                        <button onClick={() => { setEditId(m.id); setEditName(m.name); }} title="Düzenle" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(m)} title="Sil" className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {list.length === 0 && <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">Yöntem yok.</div>}
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}
