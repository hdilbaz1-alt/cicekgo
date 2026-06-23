'use client';

import { useCallback, useEffect, useState } from 'react';
import { getOrderCodes, addOrderCode, updateOrderCode, deleteOrderCode } from '@/services/orderService';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import { Tag, Plus, Pencil, Trash2, type LucideIcon } from 'lucide-react';

interface OrderCode { id: number; orderStartCode: string; orderLastCode: string }

export default function OrderCodesPage() {
  const [items, setItems] = useState<OrderCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<OrderCode | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const canManage = can(P.settingsManage);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await getOrderCodes(); setItems(r.data || []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (c: OrderCode) => {
    if (!confirm(`"${c.orderStartCode}" sipariş kodunu silmek istediğinize emin misiniz?`)) return;
    try { await deleteOrderCode(c.id); showToast('Silindi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Silinemedi'); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sipariş Kodları</h1>
          </div>
          {canManage && (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 active:scale-95 transition-all">
              <Plus className="w-5 h-5" strokeWidth={2.4} /> Yeni Kod
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-7 max-w-md">
          <StatCard label="Toplam Kod" value={items.length} grad="from-blue-500 to-indigo-600" Icon={Tag} />
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-white/70 border border-slate-100 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">Sipariş kodu yok.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Tag className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{c.orderStartCode}</div>
                      <div className="text-xs text-slate-400">Son no: {c.orderLastCode}</div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <IconBtn title="Düzenle" onClick={() => setEditing(c)} cls="text-blue-600 hover:bg-blue-50" Icon={Pencil} />
                      <IconBtn title="Sil" onClick={() => remove(c)} cls="text-red-500 hover:bg-red-50" Icon={Trash2} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(adding || editing) && (
        <CodeModal code={editing} onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={(m) => { setAdding(false); setEditing(null); showToast(m); load(); }} />
      )}
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function CodeModal({ code, onClose, onSaved }: { code: OrderCode | null; onClose: () => void; onSaved: (m: string) => void }) {
  const isEdit = !!code;
  const [startCode, setStartCode] = useState(code?.orderStartCode || '');
  const [lastCode, setLastCode] = useState(code?.orderLastCode || '1');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEscClose(onClose);
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';

  const save = async () => {
    if (!startCode.trim()) return setErr('Kod ön eki gerekli');
    setBusy(true); setErr('');
    try {
      const payload = { orderStartCode: startCode.trim(), orderLastCode: lastCode.trim() || '1' };
      if (isEdit && code) { await updateOrderCode(code.id, payload); onSaved('Güncellendi'); }
      else { await addOrderCode(payload); onSaved('Sipariş kodu eklendi'); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Kaydedilemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm max-h-[92dvh] overflow-y-auto p-6 sm:p-7">
        <h3 className="text-lg font-bold mb-4">{isEdit ? 'Kodu Düzenle' : 'Yeni Sipariş Kodu'}</h3>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Kod Ön Eki</label><input className={inputCls + ' mt-1'} value={startCode} onChange={(e) => setStartCode(e.target.value)} placeholder="örn. SIP" autoFocus /></div>
          <div><label className="text-xs font-medium text-slate-600">Son Numara</label><input className={inputCls + ' mt-1'} value={lastCode} onChange={(e) => setLastCode(e.target.value)} placeholder="1" /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={save} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? '…' : 'Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, grad, Icon }: { label: string; value: number; grad: string; Icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shrink-0`}><Icon className="w-5 h-5 sm:w-6 sm:h-6" /></div>
      <div><div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
    </div>
  );
}
function IconBtn({ title, onClick, cls, Icon }: { title: string; onClick: () => void; cls: string; Icon: LucideIcon }) {
  return <button title={title} onClick={onClick} className={`p-2 rounded-xl transition-colors ${cls}`}><Icon className="w-[18px] h-[18px]" /></button>;
}
