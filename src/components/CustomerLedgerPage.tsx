'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BASE_URL, ENDPOINTS } from '../config/api';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import { orderService, OrderItem } from '@/services/orderService';
import { refundService, RefundDto } from '@/services/refundService';
import RefundProcessModal from './RefundProcessModal';
import PaymentMethodSelect from './PaymentMethodSelect';
import { PaymentMethodDto } from '@/services/paymentMethodService';
import { Printer, Search, ChevronLeft, Wallet, HandCoins, Users, RotateCcw, type LucideIcon } from 'lucide-react';

interface Balance { customerId: number; customerName: string; totalDebit: number; totalCredit: number; balance: number; lastTransactionDate: string }
interface Ledger { id: number; customerId: number; transactionDate: string; transactionType: string; description?: string; debit: number; credit: number; balance: number; orderCode?: string; createdDate: string }

const money = (n: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const fmt = (d?: string) => d ? new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const TYPE_LABEL: Record<string, string> = {
  ORDER: 'Sipariş', PAYMENT: 'Tahsilat', ORDER_PAYMENT: 'Sipariş Ödemesi',
  ORDER_ADJUST: 'Sipariş Düzeltme', ORDER_CANCEL: 'Sipariş İptal', ORDER_RESTORE: 'Geri Yükleme', ADJUSTMENT: 'Düzeltme',
};

export default function CustomerLedgerPage({ initialFilter, initialCustomerId }: { initialFilter?: 'all' | 'debit' | 'credit'; initialCustomerId?: number } = {}) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [selected, setSelected] = useState<Balance | null>(null);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [refunds, setRefunds] = useState<RefundDto[]>([]);
  const [processRefund, setProcessRefund] = useState<RefundDto | null>(null);
  const [showPayout, setShowPayout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'debit' | 'credit'>(initialFilter ?? 'all');
  useEffect(() => { if (initialFilter) setFilter(initialFilter); }, [initialFilter]);
  const [showPay, setShowPay] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const canPay = can(P.financeCreatePayment);

  const loadBalances = useCallback(async (): Promise<Balance[]> => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE_URL}${ENDPOINTS.CUSTOMER_LEDGER_BALANCES}`, { headers: headers() });
      const body = await res.json();
      if (!res.ok || body.success === false) throw new Error(body.message || 'Yüklenemedi');
      const arr = (body.data || []) as Balance[];
      setBalances(arr);
      return arr;
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); return []; }
    finally { setLoading(false); }
  }, []);

  const loadLedger = useCallback(async (customerId: number) => {
    setLedgerLoading(true);
    try {
      const res = await fetch(`${BASE_URL}${ENDPOINTS.CUSTOMER_LEDGER_LIST}`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ customerId, page: 1, pageSize: 200 }),
      });
      const body = await res.json();
      setLedger(body.data?.items || []);
    } catch { setLedger([]); }
    finally { setLedgerLoading(false); }
  }, []);

  useEffect(() => { loadBalances(); }, [loadBalances]);
  useEffect(() => {
    (async () => {
      try { const r = await fetch(`${BASE_URL}${ENDPOINTS.TENANT_PING}`, { headers: headers() }); const b = await r.json(); if (b.success) setCompanyName(b.data.name); } catch { /* yoksay */ }
    })();
  }, []);

  const loadRefunds = useCallback(async (customerId: number) => {
    try { setRefunds(await refundService.list({ customerId })); } catch { setRefunds([]); }
  }, []);

  const select = (b: Balance) => { setSelected(b); loadLedger(b.customerId); loadRefunds(b.customerId); };

  // Siparişler sayfasından "Cari hesabına git" ile gelindiğinde ilgili müşteriyi otomatik seç
  const autoSelDone = useRef(false);
  useEffect(() => {
    if (autoSelDone.current || !initialCustomerId || balances.length === 0) return;
    const b = balances.find((x) => x.customerId === initialCustomerId);
    if (b) { autoSelDone.current = true; select(b); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances, initialCustomerId]);

  const refreshSelected = useCallback(async () => {
    if (!selected) return;
    await Promise.all([loadLedger(selected.customerId), loadRefunds(selected.customerId), loadBalances()]);
  }, [selected, loadLedger, loadRefunds, loadBalances]);

  const visible = useMemo(() => {
    let list = balances;
    if (search.trim()) { const s = search.toLowerCase(); list = list.filter((b) => b.customerName.toLowerCase().includes(s)); }
    if (filter === 'debit') list = list.filter((b) => b.balance > 0.001);
    else if (filter === 'credit') list = list.filter((b) => b.balance < -0.001);
    return [...list].sort((a, b) => b.balance - a.balance);
  }, [balances, search, filter]);

  const totals = useMemo(() => ({
    receivable: balances.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0),
    payable: balances.filter((b) => b.balance < 0).reduce((s, b) => s + Math.abs(b.balance), 0),
    debtors: balances.filter((b) => b.balance > 0.001).length,
  }), [balances]);

  const printStatement = () => {
    if (!selected) return;
    let logo = '';
    try { const ti = JSON.parse(localStorage.getItem('tenantInfo') || '{}'); logo = ti.logoBase64 || ''; } catch { /* yoksay */ }
    const collected = ledger.reduce((s, l) => s + (l.credit || 0), 0);
    const bal = selected.balance;
    const balLabel = bal > 0.001 ? 'Kalan Borç' : bal < -0.001 ? 'Fazla / Alacak' : 'Bakiye';
    const now = new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const rows = ledger.map((l) => `<tr>
      <td>${fmt(l.transactionDate)}</td>
      <td>${TYPE_LABEL[l.transactionType] || l.transactionType}</td>
      <td>${l.orderCode || '-'}</td>
      <td>${(l.description || '-').replace(/</g, '&lt;')}</td>
      <td class="r">${l.debit ? money(l.debit) : ''}</td>
      <td class="r">${l.credit ? money(l.credit) : ''}</td>
      <td class="r b">${money(l.balance)}</td>
    </tr>`).join('');

    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Cari Ekstre - ${selected.customerName}</title>
    <style>
      *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;margin:0;padding:28px}
      .head{display:flex;align-items:center;justify-content:space-between;gap:16px}
      .head .logo{width:33%} .head .logo img{max-height:64px;max-width:200px;object-fit:contain}
      .head .name{width:34%;text-align:center;font-size:22px;font-weight:800}
      .head .meta{width:33%;text-align:right;font-size:12px;color:#475569}
      hr{border:none;border-top:2px solid #0f172a;margin:14px 0}
      .cust{font-size:15px;font-weight:700;margin-bottom:8px}
      .summary{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 18px}
      .card{flex:1;min-width:140px;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px}
      .card .lbl{font-size:11px;color:#64748b} .card .val{font-size:18px;font-weight:800;margin-top:2px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left}
      th{background:#f1f5f9;font-size:11px;text-transform:uppercase;color:#475569}
      td.r,th.r{text-align:right} td.b{font-weight:700}
      .footer{margin-top:18px;font-size:11px;color:#94a3b8;text-align:center}
      @media print{body{padding:12px}}
    </style></head><body>
      <div class="head">
        <div class="logo">${logo ? `<img src="${logo}"/>` : ''}</div>
        <div class="name">${(companyName || 'Cari Hesap Ekstresi').replace(/</g, '&lt;')}</div>
        <div class="meta">Yazdırma<br>${now}</div>
      </div>
      <hr>
      <div class="cust">${selected.customerName.replace(/</g, '&lt;')} — Cari Hesap Ekstresi</div>
      <div class="summary">
        <div class="card"><div class="lbl">Toplam Bakiye</div><div class="val">${money(bal)}</div></div>
        <div class="card"><div class="lbl">İşlem Adedi</div><div class="val">${ledger.length}</div></div>
        <div class="card"><div class="lbl">Toplam Alınan</div><div class="val">${money(collected)}</div></div>
        <div class="card"><div class="lbl">${balLabel}</div><div class="val">${money(Math.abs(bal))}</div></div>
      </div>
      <table>
        <thead><tr><th>Tarih</th><th>İşlem</th><th>Sipariş</th><th>Açıklama</th><th class="r">Borç</th><th class="r">Alacak</th><th class="r">Bakiye</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#94a3b8">Hareket yok</td></tr>'}</tbody>
      </table>
      <div class="footer">${companyName || ''} · cicekgo</div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { alert('Pop-up engellendi. Lütfen izin verin.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cari Hesaplar</h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Stat label="Toplam Açık Alacak" value={money(totals.receivable)} grad="from-orange-500 to-rose-600" Icon={Wallet} />
          <Stat label="Toplam Alacaklı (biz)" value={money(totals.payable)} grad="from-emerald-500 to-teal-600" Icon={HandCoins} />
          <Stat label="Borçlu Müşteri" value={String(totals.debtors)} grad="from-blue-500 to-indigo-600" Icon={Users} />
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        <div className="grid lg:grid-cols-[380px_1fr] gap-5">
          {/* Sol: müşteri bakiyeleri */}
          <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-col lg:max-h-[75vh] ${selected ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Müşteri ara…"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                {[['all', 'Tümü'], ['debit', 'Borçlu'], ['credit', 'Alacaklı']].map(([k, l]) => (
                  <button key={k} onClick={() => setFilter(k as typeof filter)} className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-medium ${filter === k ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto">
              {loading ? <div className="p-3 space-y-2">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
                : visible.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">Kayıt yok.</div>
                : visible.map((b) => (
                  <button key={b.customerId} onClick={() => select(b)} className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex items-center justify-between gap-3 ${selected?.customerId === b.customerId ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">{b.customerName.charAt(0).toUpperCase()}</div>
                      <span className="font-medium text-slate-800 truncate">{b.customerName}</span>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 text-right ${b.balance > 0.001 ? 'text-rose-600' : b.balance < -0.001 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {money(Math.abs(b.balance))}
                      {b.balance > 0.001 ? <span className="block text-[10px] font-medium text-rose-400">Borçlu</span> : b.balance < -0.001 ? <span className="block text-[10px] font-medium text-emerald-500">Alacaklı</span> : null}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Sağ: seçili müşteri cari */}
          <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-col ${selected ? 'flex' : 'hidden lg:flex'}`}>
            {!selected ? (
              <div className="p-14 text-center text-slate-400 my-auto">Soldan bir müşteri seçin.</div>
            ) : (
              <>
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button onClick={() => setSelected(null)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 shrink-0"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="min-w-0">
                    <div className="text-lg font-bold text-slate-900 truncate">{selected.customerName}</div>
                    <div className="text-sm">
                      <span className="text-slate-500">Bakiye: </span>
                      <span className={`font-semibold ${selected.balance > 0.001 ? 'text-rose-600' : selected.balance < -0.001 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {money(Math.abs(selected.balance))} {selected.balance > 0.001 ? '· Borçlu' : selected.balance < -0.001 ? '· Alacaklı' : ''}
                      </span>
                    </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={printStatement} className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-sm font-medium inline-flex items-center gap-1.5">
                      <Printer className="w-4 h-4" />
                      Yazdır
                    </button>
                    {canPay && selected.balance < -0.001 && (
                      <button onClick={() => setShowPayout(true)} className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold inline-flex items-center gap-1.5"><RotateCcw className="w-4 h-4" />Alacağı Öde</button>
                    )}
                    {canPay && <button onClick={() => setShowPay(true)} className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20">Tahsilat Al</button>}
                  </div>
                </div>
                {(() => {
                  const open = refunds.filter((r) => r.status === 'PENDING' || r.status === 'PARTIAL');
                  if (open.length === 0) return null;
                  return (
                    <div className="border-b border-amber-100 bg-amber-50/60 px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">Bekleyen İadeler ({open.length})</span>
                        <span className="text-xs text-amber-600">· toplam {money(open.reduce((s, r) => s + r.remaining, 0))}</span>
                      </div>
                      <div className="space-y-2">
                        {open.map((r) => (
                          <div key={r.id} className="bg-white rounded-2xl border border-amber-100 px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-slate-800 truncate">{r.orderCode} · {money(r.remaining)}<span className="text-slate-400 font-normal"> kalan iade</span></div>
                              <div className="text-[11px] text-slate-400">
                                {r.status === 'PARTIAL' ? `Kısmen iade edildi (${money(r.refundedAmount)}/${money(r.amount)})` : `İade tutarı ${money(r.amount)}`}
                                {r.plannedDate ? ` · plan: ${fmt(r.plannedDate)}` : ''}
                                {r.reason ? ` · ${r.reason}` : ''}
                              </div>
                            </div>
                            {canPay && (
                              <button onClick={() => setProcessRefund(r)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shrink-0">İade Et</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <div className="overflow-y-auto max-h-[55vh] lg:max-h-[60vh]">
                  {ledgerLoading ? <div className="p-8 text-center text-slate-400">Yükleniyor…</div>
                    : ledger.length === 0 ? <div className="p-8 text-center text-slate-400">Hareket yok.</div>
                    : (
                      <>
                        {/* Masaüstü tablo */}
                        <table className="hidden lg:table w-full text-sm">
                          <thead className="bg-slate-50 text-slate-500 text-left sticky top-0">
                            <tr><th className="px-4 py-2.5 font-medium">Tarih</th><th className="px-4 py-2.5 font-medium">İşlem</th><th className="px-4 py-2.5 font-medium">Açıklama</th><th className="px-4 py-2.5 font-medium text-right">Borç</th><th className="px-4 py-2.5 font-medium text-right">Alacak</th><th className="px-4 py-2.5 font-medium text-right">Bakiye</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ledger.map((l) => (
                              <tr key={l.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmt(l.transactionDate)}</td>
                                <td className="px-4 py-2.5"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{TYPE_LABEL[l.transactionType] || l.transactionType}</span>{l.orderCode && <span className="ml-1 text-[11px] text-slate-400">{l.orderCode}</span>}</td>
                                <td className="px-4 py-2.5 text-slate-600">{l.description || '-'}</td>
                                <td className="px-4 py-2.5 text-right text-rose-600">{l.debit ? money(l.debit) : ''}</td>
                                <td className="px-4 py-2.5 text-right text-emerald-600">{l.credit ? money(l.credit) : ''}</td>
                                <td className="px-4 py-2.5 text-right font-medium text-slate-800">{money(l.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Mobil kartlar */}
                        <div className="lg:hidden divide-y divide-slate-100">
                          {ledger.map((l) => (
                            <div key={l.id} className="px-4 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{TYPE_LABEL[l.transactionType] || l.transactionType}</span>
                                <span className="text-[11px] text-slate-400">{fmt(l.transactionDate)}</span>
                              </div>
                              {(l.description || l.orderCode) && <div className="mt-1 text-[13px] text-slate-600">{l.description || ''}{l.orderCode ? ` · ${l.orderCode}` : ''}</div>}
                              <div className="mt-1.5 flex items-center justify-between text-sm">
                                <span>{l.debit ? <span className="text-rose-600">Borç {money(l.debit)}</span> : <span className="text-emerald-600">Alacak {money(l.credit)}</span>}</span>
                                <span className="font-semibold text-slate-800">Bakiye {money(l.balance)}</span>
                              </div>
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
        <PaymentModal customer={selected} onClose={() => setShowPay(false)} onSaved={async () => { setShowPay(false); showToast('Tahsilat kaydedildi'); const arr = await loadBalances(); const upd = arr.find((x) => x.customerId === selected.customerId); if (upd) setSelected(upd); loadLedger(selected.customerId); }} />
      )}
      {processRefund && (
        <RefundProcessModal refund={processRefund} onClose={() => setProcessRefund(null)}
          onDone={async () => { setProcessRefund(null); showToast('İade işlendi'); await refreshSelected(); }} />
      )}
      {showPayout && selected && (
        <PayoutModal customer={selected} onClose={() => setShowPayout(false)}
          onSaved={async () => { setShowPayout(false); showToast('Alacak ödendi'); await refreshSelected(); }} />
      )}
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function PayoutModal({ customer, onClose, onSaved }: { customer: Balance; onClose: () => void; onSaved: () => void }) {
  const max = Math.abs(customer.balance);
  const [amount, setAmount] = useState(String(max));
  const [desc, setDesc] = useState('');
  const [methodId, setMethodId] = useState<number | ''>('');
  const [pmList, setPmList] = useState<PaymentMethodDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEscClose(onClose);
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';

  const save = async () => {
    const a = Number(amount);
    if (!a || a <= 0) return setErr('Geçerli tutar girin');
    if (a > max + 0.001) return setErr(`Alacaktan (${money(max)}) fazla ödenemez`);
    if (!methodId) return setErr('Ödeme yöntemi seçin');
    setBusy(true); setErr('');
    try {
      const res = await fetch(`${BASE_URL}${ENDPOINTS.CUSTOMER_LEDGER_PAYOUT}`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ customerId: customer.customerId, amount: a, description: desc, paymentMethodId: Number(methodId), paymentDate: new Date().toISOString() }),
      });
      const b = await res.json();
      if (!res.ok || b.success === false) throw new Error(b.message || 'Ödenemedi');
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ödenemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <h3 className="text-lg font-bold mb-1">Alacağı Öde</h3>
        <p className="text-sm text-slate-500 mb-4">{customer.customerName} · alacak <b className="text-emerald-600">{money(max)}</b></p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">İade Tutarı</label>
            <input type="number" className={inputCls + ' mt-1'} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            <span className="text-[11px] text-slate-400">Tamamı ödenirse bakiye 0 olur.</span>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Ödeme Yöntemi *</label><PaymentMethodSelect value={methodId} onChange={setMethodId} methods={pmList} setMethods={setPmList} className={inputCls + ' mt-1'} /></div>
          <div><label className="text-xs font-medium text-slate-600">Açıklama (opsiyonel)</label><input className={inputCls + ' mt-1'} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={save} disabled={busy} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? '…' : 'Öde'}</button>
        </div>
      </div>
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

function PaymentModal({ customer, onClose, onSaved }: { customer: Balance; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'general' | 'order'>('general');
  const [amount, setAmount] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [methodId, setMethodId] = useState<number | ''>('');
  const [pmList, setPmList] = useState<PaymentMethodDto[]>([]);
  useEscClose(onClose);
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';

  // Sipariş bazlı moda geçince müşterinin kalanı olan siparişlerini yükle
  useEffect(() => {
    if (type !== 'order' || orders.length > 0) return;
    let alive = true;
    setOrdersLoading(true);
    orderService.getOrders({ customerId: customer.customerId, page: 1, pageSize: 200 })
      .then((r) => { if (alive) setOrders((r.data?.items || []).filter((o) => (o.orderRemainingAmount ?? 0) > 0.001)); })
      .catch(() => { if (alive) setOrders([]); })
      .finally(() => { if (alive) setOrdersLoading(false); });
    return () => { alive = false; };
  }, [type, customer.customerId, orders.length]);

  const selectedOrder = orders.find((o) => o.orderCode === orderCode) || null;

  const pickOrder = (code: string) => {
    setOrderCode(code);
    const o = orders.find((x) => x.orderCode === code);
    if (o) setAmount(String(o.orderRemainingAmount ?? ''));
  };

  const save = async () => {
    const a = Number(amount);
    if (!a || a <= 0) return setErr('Geçerli tutar girin');
    if (type === 'order' && !orderCode.trim()) return setErr('Lütfen bir sipariş seçin');
    if (type === 'order' && selectedOrder && a > (selectedOrder.orderRemainingAmount ?? 0) + 0.001)
      return setErr(`Tutar kalan tutardan (${money(selectedOrder.orderRemainingAmount ?? 0)}) fazla olamaz`);
    if (!methodId) return setErr('Ödeme yöntemi seçin');
    setBusy(true); setErr('');
    // Seçilen güne gerçek saati ekle (gece yarısı yerine işlem anı)
    const today = new Date().toISOString().split('T')[0];
    const ts = date === today ? new Date() : new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`);
    const paymentDate = ts.toISOString();
    const ep = type === 'order' ? ENDPOINTS.CUSTOMER_LEDGER_ORDER_PAYMENT : ENDPOINTS.CUSTOMER_LEDGER_PAYMENT;
    const payload = type === 'order'
      ? { customerId: customer.customerId, orderCode: orderCode.trim(), amount: a, description: desc, paymentMethodId: Number(methodId), paymentDate }
      : { customerId: customer.customerId, amount: a, description: desc, paymentMethodId: Number(methodId), paymentDate };
    try {
      const res = await fetch(`${BASE_URL}${ep}`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
      const b = await res.json();
      if (!res.ok || b.success === false) throw new Error(b.message || 'Eklenemedi');
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Eklenemedi'); setBusy(false); }
  };

  const switchType = (t: 'general' | 'order') => { setType(t); setErr(''); if (t === 'general') { setOrderCode(''); } };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <h3 className="text-lg font-bold mb-1">Tahsilat Al</h3>
        <p className="text-sm text-slate-500 mb-4">{customer.customerName}</p>
        <div className="flex gap-2 mb-4">
          <button onClick={() => switchType('general')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${type === 'general' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Genel</button>
          <button onClick={() => switchType('order')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${type === 'order' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Sipariş Bazlı</button>
        </div>
        <div className="space-y-3">
          {type === 'order' && (
            <div>
              <label className="text-xs font-medium text-slate-600">Sipariş</label>
              {ordersLoading ? (
                <div className="mt-1 h-11 rounded-2xl skeleton" />
              ) : orders.length === 0 ? (
                <p className="mt-1 text-sm text-slate-400 bg-slate-50 rounded-2xl px-4 py-2.5">Bu müşterinin kalanı olan siparişi yok.</p>
              ) : (
                <select className={inputCls + ' mt-1'} value={orderCode} onChange={(e) => pickOrder(e.target.value)}>
                  <option value="">Sipariş seçin…</option>
                  {orders.map((o) => (
                    <option key={o.orderCode} value={o.orderCode}>
                      {o.orderCode} · {o.recipientName || '—'} · kalan {money(o.orderRemainingAmount ?? 0)}
                    </option>
                  ))}
                </select>
              )}
              {selectedOrder && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Toplam {money(selectedOrder.orderAmount ?? 0)} · Kalan <b className="text-orange-600">{money(selectedOrder.orderRemainingAmount ?? 0)}</b>
                </p>
              )}
            </div>
          )}
          <div><label className="text-xs font-medium text-slate-600">Tutar</label><input type="number" className={inputCls + ' mt-1'} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
          <div><label className="text-xs font-medium text-slate-600">Ödeme Yöntemi *</label><PaymentMethodSelect value={methodId} onChange={setMethodId} methods={pmList} setMethods={setPmList} className={inputCls + ' mt-1'} /></div>
          <div><label className="text-xs font-medium text-slate-600">Tarih</label><input type="date" className={inputCls + ' mt-1'} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Açıklama {type === 'order' && <span className="text-slate-400 font-normal">(opsiyonel — “siparişe ödeme” notuna eklenir)</span>}</label><input className={inputCls + ' mt-1'} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={save} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? '…' : 'Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}
