'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { financeService, GeneralSummary, CashMovement, Expense } from '@/services/financeService';
import { refundService, RefundDto } from '@/services/refundService';
import RefundProcessModal from './RefundProcessModal';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import { TrendingUp, HandCoins, Wallet, Banknote, Plus, RotateCcw, Eye, EyeOff, type LucideIcon } from 'lucide-react';

const money = (n: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const fmt = (d: string) => new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function range(preset: string): { from?: string; to?: string } {
  const now = new Date();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (preset === 'today') return { from: iso(now), to: iso(now) };
  if (preset === 'month') return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
  if (preset === 'week') { const s = new Date(now); s.setDate(now.getDate() - 6); return { from: iso(s), to: iso(now) }; }
  return {};
}

const EXPENSE_CATS = ['Çiçek Alımı', 'Kurye/Yakıt', 'Kira', 'Personel', 'Ambalaj', 'Fatura', 'Diğer'];

export default function FinancePage() {
  const [preset, setPreset] = useState('month');
  const [summary, setSummary] = useState<GeneralSummary | null>(null);
  const [tab, setTab] = useState<'cash' | 'expense' | 'refunds'>('cash');
  const [cash, setCash] = useState<CashMovement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refunds, setRefunds] = useState<RefundDto[]>([]);
  const [processRefund, setProcessRefund] = useState<RefundDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExp, setShowExp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const [showMethods, setShowMethods] = useState(true);
  useEffect(() => { setShowMethods(localStorage.getItem('cg_fin_methods') !== '0'); }, []);
  const toggleMethods = () => setShowMethods((v) => { localStorage.setItem('cg_fin_methods', v ? '0' : '1'); return !v; });

  const byMethod = useMemo(() => {
    const map = new Map<string, { method: string; in: number; out: number }>();
    for (const c of cash) {
      const k = c.paymentMethod || 'Belirtilmemiş';
      const e = map.get(k) || { method: k, in: 0, out: 0 };
      if (c.direction === 'IN') e.in += c.amount; else e.out += c.amount;
      map.set(k, e);
    }
    return Array.from(map.values()).sort((a, b) => (b.in + b.out) - (a.in + a.out));
  }, [cash]);

  const canExpense = can(P.financeManualMovement);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const { from, to } = range(preset);
    try {
      const [s, c, e, rf] = await Promise.all([
        financeService.summary(from, to),
        financeService.cashMovements(from, to),
        financeService.expenses(from, to),
        refundService.list({ onlyOpen: true }).catch(() => [] as RefundDto[]),
      ]);
      setSummary(s); setCash(c); setExpenses(e); setRefunds(rf);
    } catch (er) { setError(er instanceof Error ? er.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, [preset]);
  useEffect(() => { load(); }, [load]);

  const delExp = async (e: Expense) => {
    if (!confirm(`"${e.category}" giderini silmek istiyor musunuz?`)) return;
    try { await financeService.deleteExpense(e.id); showToast('Gider silindi'); load(); }
    catch (er) { alert(er instanceof Error ? er.message : 'Silinemedi'); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kasa & Genel Cari</h1>
          </div>
          <div className="flex gap-2">
            {[['today', 'Bugün'], ['week', 'Hafta'], ['month', 'Ay'], ['all', 'Tümü']].map(([k, lbl]) => (
              <button key={k} onClick={() => setPreset(k)} className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${preset === k ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{lbl}</button>
            ))}
          </div>
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {/* Özet */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Stat label="Toplam Satış" value={money(summary?.totalSales || 0)} grad="from-blue-500 to-indigo-600" Icon={TrendingUp} />
          <Stat label="Tahsilat" value={money(summary?.totalCollected || 0)} grad="from-emerald-500 to-teal-600" Icon={HandCoins} />
          <Stat label="Açık Alacak" value={money(summary?.openReceivables || 0)} grad="from-orange-500 to-rose-600" Icon={Wallet} />
          <Stat label="Net Kasa" value={money(summary?.netCash || 0)} grad="from-violet-500 to-purple-600" Icon={Banknote} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <MiniStat label="Kasa Girişi" value={money(summary?.cashIn || 0)} cls="text-emerald-600" />
          <MiniStat label="Kasa Çıkışı" value={money(summary?.cashOut || 0)} cls="text-red-600" />
          <MiniStat label="Gider" value={money(summary?.expenseTotal || 0)} cls="text-rose-600" />
          <MiniStat label="Sipariş Adedi" value={String(summary?.orderCount || 0)} cls="text-slate-700" />
        </div>

        {/* Ödeme yöntemine göre (açılır/kapanır) */}
        <div className="mb-6">
          <button onClick={toggleMethods} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800 mb-2">
            {showMethods ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Ödeme Yöntemine Göre {showMethods ? '(gizle)' : '(göster)'}
          </button>
          {showMethods && (
            byMethod.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-sm text-slate-400">Bu dönemde kasa hareketi yok.</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {byMethod.map((m) => (
                  <div key={m.method} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="text-sm font-semibold text-slate-800 truncate">{m.method}</div>
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-emerald-600">Giriş {money(m.in)}</span>
                      {m.out > 0 && <span className="text-red-500">Çıkış {money(m.out)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Sekmeler */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setTab('cash')} className={`px-4 py-2 rounded-2xl text-sm font-medium ${tab === 'cash' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Kasa Hareketleri</button>
            <button onClick={() => setTab('expense')} className={`px-4 py-2 rounded-2xl text-sm font-medium ${tab === 'expense' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Giderler</button>
            <button onClick={() => setTab('refunds')} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium ${tab === 'refunds' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              <RotateCcw className="w-4 h-4" /> Bekleyen İadeler
              {refunds.length > 0 && <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'refunds' ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>{refunds.length}</span>}
            </button>
          </div>
          {tab === 'expense' && canExpense && (
            <button onClick={() => setShowExp(true)} className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-2xl text-sm font-semibold shadow-lg shadow-blue-600/25"><Plus className="w-4 h-4" strokeWidth={2.4} />Gider Ekle</button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Yükleniyor…</div>
          ) : tab === 'cash' ? (
            cash.length === 0 ? <div className="p-10 text-center text-slate-400">Kasa hareketi yok.</div> : (
              <>
                <table className="hidden lg:table w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left"><tr><th className="px-4 py-3 font-medium">Tarih</th><th className="px-4 py-3 font-medium">Tür</th><th className="px-4 py-3 font-medium">Açıklama</th><th className="px-4 py-3 font-medium text-right">Tutar</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {cash.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">{fmt(c.transactionDate)}</td>
                        <td className="px-4 py-3">{c.movementType}</td>
                        <td className="px-4 py-3 text-slate-600">{c.description || '-'}</td>
                        <td className={`px-4 py-3 text-right font-medium ${c.direction === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>{c.direction === 'IN' ? '+' : '−'}{money(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="lg:hidden divide-y divide-slate-100">
                  {cash.map((c) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-slate-700">{c.movementType}</div>
                        <div className="text-[12px] text-slate-400 truncate">{c.description || fmt(c.transactionDate)}</div>
                      </div>
                      <span className={`font-semibold text-sm shrink-0 ${c.direction === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>{c.direction === 'IN' ? '+' : '−'}{money(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : tab === 'expense' ? (
            expenses.length === 0 ? <div className="p-10 text-center text-slate-400">Gider yok.</div> : (
              <>
                <table className="hidden lg:table w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left"><tr><th className="px-4 py-3 font-medium">Tarih</th><th className="px-4 py-3 font-medium">Kategori</th><th className="px-4 py-3 font-medium">Açıklama</th><th className="px-4 py-3 font-medium text-right">Tutar</th><th className="px-4 py-3"></th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">{fmt(e.transactionDate)}</td>
                        <td className="px-4 py-3 font-medium">{e.category}</td>
                        <td className="px-4 py-3 text-slate-600">{e.description || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-rose-600">{money(e.amount)}</td>
                        <td className="px-4 py-3 text-right">{canExpense && <button onClick={() => delExp(e)} className="text-red-500 hover:text-red-600 text-sm">Sil</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="lg:hidden divide-y divide-slate-100">
                  {expenses.map((e) => (
                    <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-700">{e.category}</div>
                        <div className="text-[12px] text-slate-400 truncate">{e.description || fmt(e.transactionDate)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-sm text-rose-600">{money(e.amount)}</span>
                        {canExpense && <button onClick={() => delExp(e)} className="text-red-500 text-xs">Sil</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            refunds.length === 0 ? <div className="p-10 text-center text-slate-400">Bekleyen iade yok.</div> : (
              <>
                <div className="px-4 sm:px-5 py-3 border-b border-slate-100 text-sm text-slate-600">
                  {refunds.length} bekleyen iade · toplam <b className="text-amber-600">{money(refunds.reduce((s, r) => s + r.remaining, 0))}</b>
                </div>
                <table className="hidden lg:table w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left"><tr><th className="px-4 py-3 font-medium">Müşteri</th><th className="px-4 py-3 font-medium">Sipariş</th><th className="px-4 py-3 font-medium">Durum / Plan</th><th className="px-4 py-3 font-medium text-right">Kalan İade</th><th className="px-4 py-3"></th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {refunds.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{r.customerName || r.recipientName || (r.customerId ? `#${r.customerId}` : 'Cari dışı')}</td>
                        <td className="px-4 py-3 text-slate-500">{r.orderCode}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.status === 'PARTIAL' ? `Kısmen (${money(r.refundedAmount)}/${money(r.amount)})` : 'Bekliyor'}
                          {r.plannedDate ? ` · ${fmt(r.plannedDate)}` : ''}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-600">{money(r.remaining)}</td>
                        <td className="px-4 py-3 text-right">{can(P.financeCreatePayment) && (
                          <div className="inline-flex items-center gap-1.5">
                            <button onClick={() => setProcessRefund(r)} className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold">İade Et</button>
                            <button title="Ödeme başka yolla yapıldıysa: kasa kaydı oluşturmadan kapatır"
                              onClick={async () => { if (!confirm('Bu iade ödeme/kasa kaydı OLUŞTURMADAN kapatılacak. Ödeme zaten yapıldıysa onaylayın.')) return; try { await refundService.resolve(r.id); showToast('İade kapatıldı'); load(); } catch (e) { showToast(e instanceof Error ? e.message : 'Kapatılamadı'); } }}
                              className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-100 text-xs font-semibold">Ödendi işaretle</button>
                          </div>
                        )}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="lg:hidden divide-y divide-slate-100">
                  {refunds.map((r) => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 truncate">{r.customerName || r.recipientName || (r.customerId ? `#${r.customerId}` : 'Cari dışı')}</span>
                        <span className="font-semibold text-sm text-amber-600 shrink-0">{money(r.remaining)}</span>
                      </div>
                      <div className="text-[12px] text-slate-400">{r.orderCode}{r.plannedDate ? ` · plan ${fmt(r.plannedDate)}` : ''}{r.status === 'PARTIAL' ? ` · kısmen` : ''}</div>
                      {can(P.financeCreatePayment) && (
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => setProcessRefund(r)} className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold">İade Et</button>
                          <button onClick={async () => { if (!confirm('Bu iade ödeme/kasa kaydı OLUŞTURMADAN kapatılacak. Ödeme zaten yapıldıysa onaylayın.')) return; try { await refundService.resolve(r.id); showToast('İade kapatıldı'); load(); } catch (e) { showToast(e instanceof Error ? e.message : 'Kapatılamadı'); } }}
                            className="flex-1 py-2 rounded-xl border border-amber-300 text-amber-700 text-xs font-semibold">Ödendi işaretle</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>

      {processRefund && <RefundProcessModal refund={processRefund} onClose={() => setProcessRefund(null)} onDone={() => { setProcessRefund(null); showToast('İade işlendi'); load(); }} />}
      {showExp && <ExpenseModal onClose={() => setShowExp(false)} onSaved={() => { setShowExp(false); showToast('Gider eklendi'); load(); }} />}
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function Stat({ label, value, grad, Icon }: { label: string; value: string; grad: string; Icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shrink-0`}><Icon className="w-5 h-5 sm:w-6 sm:h-6" /></div>
      <div className="min-w-0">
        <div className="text-base sm:text-xl font-bold tracking-tight text-slate-900 truncate">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
function MiniStat({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
      <div className={`text-lg font-bold ${cls}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function ExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [category, setCategory] = useState(EXPENSE_CATS[0]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEscClose(onClose);
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';

  const save = async () => {
    const a = Number(amount);
    if (!a || a <= 0) return setErr('Geçerli bir tutar girin');
    setBusy(true);
    try { await financeService.addExpense({ category, amount: a, description: desc }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Eklenemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm max-h-[92dvh] overflow-y-auto p-6 sm:p-7">
        <h3 className="text-lg font-bold mb-4">Gider Ekle</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Kategori</label>
            <select className={inputCls + ' mt-1'} value={category} onChange={(e) => setCategory(e.target.value)}>{EXPENSE_CATS.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Tutar</label><input type="number" className={inputCls + ' mt-1'} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
          <div><label className="text-xs font-medium text-slate-600">Açıklama</label><input className={inputCls + ' mt-1'} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
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
