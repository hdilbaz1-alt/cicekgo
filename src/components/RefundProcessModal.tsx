'use client';

import { useState } from 'react';
import { refundService, RefundDto } from '@/services/refundService';
import PaymentMethodSelect from './PaymentMethodSelect';
import { PaymentMethodDto } from '@/services/paymentMethodService';
import { useEscClose } from '@/lib/useEscClose';

const money = (n: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;

export default function RefundProcessModal({ refund, onClose, onDone }: { refund: RefundDto; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState(String(refund.remaining));
  const [note, setNote] = useState('');
  const [methodId, setMethodId] = useState<number | ''>('');
  const [pmList, setPmList] = useState<PaymentMethodDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEscClose(onClose);
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';

  const submit = async () => {
    const a = mode === 'full' ? refund.remaining : Number(amount);
    if (mode === 'partial' && (!a || a <= 0)) return setErr('Geçerli tutar girin');
    if (a > refund.remaining + 0.001) return setErr(`Kalan iadeden (${money(refund.remaining)}) fazla olamaz`);
    if (!methodId) return setErr('Ödeme yöntemi seçin');
    setBusy(true); setErr('');
    try {
      await refundService.process(refund.id, { amount: mode === 'full' ? null : a, note: note.trim() || undefined, paymentMethodId: Number(methodId) });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : 'İşlenemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <h3 className="text-lg font-bold mb-1">İade Et</h3>
        <p className="text-sm text-slate-500 mb-4">{refund.orderCode}{refund.customerName ? ` · ${refund.customerName}` : ''} · kalan iade {money(refund.remaining)}</p>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('full')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${mode === 'full' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Tam İade</button>
          <button onClick={() => setMode('partial')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${mode === 'partial' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Kısmi İade</button>
        </div>
        <div className="space-y-3">
          {mode === 'partial' && (
            <div><label className="text-xs font-medium text-slate-600">İade Tutarı</label><input type="number" className={inputCls + ' mt-1'} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
          )}
          <div><label className="text-xs font-medium text-slate-600">Ödeme Yöntemi *</label><PaymentMethodSelect value={methodId} onChange={setMethodId} methods={pmList} setMethods={setPmList} className={inputCls + ' mt-1'} /></div>
          <div><label className="text-xs font-medium text-slate-600">Açıklama (opsiyonel)</label><input className={inputCls + ' mt-1'} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={submit} disabled={busy} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? '…' : 'İadeyi Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}
