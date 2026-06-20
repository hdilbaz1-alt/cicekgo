'use client';

import { useCallback, useEffect, useState } from 'react';
import { orderService, OrderItem, OrderLedger } from '@/services/orderService';
import StatusBadge from './StatusBadge';
import PaymentMethodSelect from './PaymentMethodSelect';
import { PaymentMethodDto } from '@/services/paymentMethodService';
import { useEscClose } from '@/lib/useEscClose';
import { Search, ChevronLeft, Phone, RotateCcw } from 'lucide-react';

const money = (n?: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const fmt = (d?: string | null) => d ? new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
const TYPE_LABEL: Record<string, string> = { COLLECTION: 'Tahsilat', REFUND: 'İade', SALE: 'Satış', EXPENSE: 'Gider', ADJUST: 'Düzeltme' };

export default function NonCariPage() {
  const [q, setQ] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrderItem | null>(null);
  const [ledger, setLedger] = useState<OrderLedger | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const search = useCallback(async (term: string) => {
    setLoading(true);
    try { setOrders(await orderService.search(term.trim(), true)); }
    catch { setOrders([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { search(''); }, [search]);

  const loadLedger = useCallback(async (code: string) => {
    setLedgerLoading(true);
    try { setLedger(await orderService.getLedger(code)); }
    catch { setLedger(null); }
    finally { setLedgerLoading(false); }
  }, []);

  const select = (o: OrderItem) => { setSelected(o); loadLedger(o.orderCode); };
  const refreshSelected = useCallback(async () => {
    if (selected) await loadLedger(selected.orderCode);
    await search(q);
  }, [selected, q, loadLedger, search]);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Cari Olmayanlar</h1>
        <p className="text-slate-500 text-sm mb-6">Cari hesabı olmayan siparişler. Soldan seç, sağda hareketleri gör; tahsilat ve iade yap.</p>

        <div className="grid lg:grid-cols-[380px_1fr] gap-5">
          {/* Sol: arama + sipariş listesi */}
          <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col gap-3`}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search(q); }}
                placeholder="Sipariş kodu veya telefon (örn. 05531234567)"
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? <div className="p-3 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
                : orders.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">Sonuç yok.</div>
                  : orders.map((o) => (
                    <button key={o.orderCode} onClick={() => select(o)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex items-center justify-between gap-3 ${selected?.orderCode === o.orderCode ? 'bg-indigo-50' : ''}`}>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 truncate">{o.recipientName || o.senderName || '—'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{o.orderCode}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-slate-800">{money(o.orderAmount)}</div>
                        {o.orderRemainingAmount > 0 && <div className="text-[11px] text-orange-500">Kalan {money(o.orderRemainingAmount)}</div>}
                      </div>
                    </button>
                  ))}
            </div>
          </div>

          {/* Sağ: seçili sipariş hareketleri */}
          <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-col ${selected ? 'flex' : 'hidden lg:flex'}`}>
            {!selected ? (
              <div className="p-14 text-center text-slate-400 my-auto">Soldan bir sipariş seçin.</div>
            ) : (
              <>
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <div className="flex items-start gap-2">
                    <button onClick={() => setSelected(null)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 shrink-0"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900 truncate">{ledger?.recipientName || ledger?.senderName || selected.recipientName || '—'}</span>
                        <StatusBadge status={ledger?.status || selected.orderStatus} />
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{selected.orderCode}{(ledger?.recipientPhone || ledger?.senderPhone) ? ` · ${ledger?.recipientPhone || ledger?.senderPhone}` : ''}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <span className="text-slate-500">Toplam: <b className="text-slate-800">{money(ledger?.amount ?? selected.orderAmount)}</b></span>
                    <span className="text-slate-500">Ödenen: <b className="text-emerald-600">{money(ledger?.paid)}</b></span>
                    <span className="text-slate-500">Kalan: <b className="text-orange-600">{money(ledger?.remaining ?? selected.orderRemainingAmount)}</b></span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {(ledger?.remaining ?? selected.orderRemainingAmount) > 0.001 && (
                      <button onClick={() => setShowPay(true)} className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">Tahsilat Al</button>
                    )}
                    {(ledger?.status || selected.orderStatus) === 'İptal Edildi' && (ledger?.paid ?? 0) > 0.001 && (
                      <button onClick={() => setShowRefund(true)} className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold inline-flex items-center gap-1.5"><RotateCcw className="w-4 h-4" />İade Et</button>
                    )}
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[55vh] lg:max-h-[60vh]">
                  {ledgerLoading ? <div className="p-3 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
                    : (ledger?.movements.length ?? 0) === 0 ? <div className="p-8 text-center text-slate-400 text-sm">Henüz giriş/çıkış yok.</div>
                      : (
                        <>
                          <table className="hidden lg:table w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-left sticky top-0"><tr><th className="px-4 py-2.5 font-medium">Tarih</th><th className="px-4 py-2.5 font-medium">İşlem</th><th className="px-4 py-2.5 font-medium">Yöntem</th><th className="px-4 py-2.5 font-medium text-right">Giriş</th><th className="px-4 py-2.5 font-medium text-right">Çıkış</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                              {ledger!.movements.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmt(m.date)}</td>
                                  <td className="px-4 py-2.5"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{TYPE_LABEL[m.movementType] || m.movementType}</span></td>
                                  <td className="px-4 py-2.5 text-slate-500">{m.paymentMethod || '-'}</td>
                                  <td className="px-4 py-2.5 text-right text-emerald-600">{m.direction === 'IN' ? money(m.amount) : ''}</td>
                                  <td className="px-4 py-2.5 text-right text-rose-600">{m.direction === 'OUT' ? money(m.amount) : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="lg:hidden divide-y divide-slate-100">
                            {ledger!.movements.map((m) => (
                              <div key={m.id} className="px-4 py-3">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{TYPE_LABEL[m.movementType] || m.movementType}</span>
                                  <span className={`font-semibold text-sm ${m.direction === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.direction === 'IN' ? '+' : '−'}{money(m.amount)}</span>
                                </div>
                                <div className="mt-1 text-[12px] text-slate-400">{fmt(m.date)}{m.paymentMethod ? ` · ${m.paymentMethod}` : ''}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showPay && selected && (
        <AmountModal title="Tahsilat Al" subtitle={selected.orderCode} confirmLabel="Tahsil Et" tone="indigo"
          defaultAmount={ledger?.remaining ?? selected.orderRemainingAmount}
          onClose={() => setShowPay(false)}
          onSubmit={async (amount, methodId, note) => { await orderService.payOrder(selected.orderCode, { amount, paymentMethodId: methodId, description: note }); setShowPay(false); showToast('Tahsilat kaydedildi'); await refreshSelected(); }} />
      )}
      {showRefund && selected && (
        <AmountModal title="İade Et" subtitle={selected.orderCode} confirmLabel="İade Et" tone="amber"
          defaultAmount={ledger?.paid ?? 0}
          onClose={() => setShowRefund(false)}
          onSubmit={async (amount, methodId, note) => { await orderService.refundOrder(selected.orderCode, { amount, paymentMethodId: methodId, note }); setShowRefund(false); showToast('İade kaydedildi'); await refreshSelected(); }} />
      )}
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function AmountModal({ title, subtitle, confirmLabel, tone, defaultAmount, onClose, onSubmit }: {
  title: string; subtitle: string; confirmLabel: string; tone: 'indigo' | 'amber'; defaultAmount: number;
  onClose: () => void; onSubmit: (amount: number, methodId: number, note: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(defaultAmount > 0 ? defaultAmount : ''));
  const [methodId, setMethodId] = useState<number | ''>('');
  const [pmList, setPmList] = useState<PaymentMethodDto[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEscClose(onClose);
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';
  const btn = tone === 'amber' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700';

  const save = async () => {
    const a = Number(amount);
    if (!a || a <= 0) return setErr('Geçerli tutar girin');
    if (!methodId) return setErr('Ödeme yöntemi seçin');
    setBusy(true); setErr('');
    try { await onSubmit(a, Number(methodId), note.trim()); }
    catch (e) { setErr(e instanceof Error ? e.message : 'İşlenemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4 font-mono">{subtitle}</p>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Tutar</label><input type="number" className={inputCls + ' mt-1'} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
          <div><label className="text-xs font-medium text-slate-600">Ödeme Yöntemi *</label><PaymentMethodSelect value={methodId} onChange={setMethodId} methods={pmList} setMethods={setPmList} className={inputCls + ' mt-1'} /></div>
          <div><label className="text-xs font-medium text-slate-600">Açıklama (opsiyonel)</label><input className={inputCls + ' mt-1'} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={save} disabled={busy} className={`${btn} text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50`}>{busy ? '…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
