'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiUrl, getEndpoint } from '@/config/api';
import { can, P } from '@/lib/permissions';
import { ClipboardList, TrendingUp, HandCoins, Wallet, Truck, AlertTriangle, ChevronRight, type LucideIcon } from 'lucide-react';

interface SalesPoint { date: string; total: number; count: number }
interface Summary {
  orderCount: number; totalSales: number; collected: number; openReceivables: number;
  netCash: number; expenseTotal: number; criticalStockCount: number;
  statusCounts: { status: string; count: number }[];
  salesSeries: SalesPoint[];
  topProducts: { name: string; quantity: number; total: number }[];
  topCustomers: { name: string; orderCount: number; total: number }[];
}

const money = (n: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dm = (s: string) => { const d = new Date(s); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`; };
const dmy = (s: string) => { const d = new Date(s); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };

const STATUS_HEX: Record<string, string> = {
  'Yeni': '#3b82f6', 'Onaylandı': '#0ea5e9', 'Hazırlanıyor': '#f59e0b', 'Hazır': '#6366f1',
  'Kuryeye Verildi': '#8b5cf6', 'Yola Çıktı': '#a855f7', 'Teslim Edildi': '#10b981',
  'İptal Edildi': '#ef4444', 'Silindi': '#94a3b8',
};
const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
const statusHex = (s: string, i: number) => STATUS_HEX[s] || PALETTE[i % PALETTE.length];

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <svg className="w-9 h-9 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
      <span className="text-sm">{label || 'Yükleniyor…'}</span>
    </div>
  );
}

export default function DashboardPage({ onNavigate }: { onNavigate?: (p: string, opts?: Record<string, unknown>) => void }) {
  const [preset, setPreset] = useState('today');
  const [customFrom, setCustomFrom] = useState(iso(new Date()));
  const [customTo, setCustomTo] = useState(iso(new Date()));
  const [s, setS] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const me = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  const computeRange = useCallback((): { from?: string; to?: string } => {
    const now = new Date();
    if (preset === 'today') return { from: iso(now), to: iso(now) };
    if (preset === 'yesterday') { const y = new Date(now); y.setDate(now.getDate() - 1); return { from: iso(y), to: iso(y) }; }
    if (preset === 'week') { const a = new Date(now); a.setDate(now.getDate() - 6); return { from: iso(a), to: iso(now) }; }
    if (preset === 'month') return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return {};
  }, [preset, customFrom, customTo]);

  const load = useCallback(async () => {
    setLoading(true); setDenied(false);
    const { from, to } = computeRange();
    const p = new URLSearchParams(); if (from) p.set('from', from); if (to) p.set('to', to);
    try {
      const res = await fetch(`${getApiUrl(getEndpoint('DASHBOARD_SUMMARY'))}?${p}`, { headers: headers() });
      if (res.status === 403) { setDenied(true); return; }
      const body = await res.json();
      if (body.success) setS(body.data);
    } catch { /* yoksay */ }
    finally { setLoading(false); }
  }, [computeRange]);
  useEffect(() => { load(); }, [load]);

  // Grafik: seçilen aralıktaki TÜM günleri (boş günler 0) içerir
  const chartData = useMemo<SalesPoint[]>(() => {
    const series = s?.salesSeries || [];
    const { from, to } = computeRange();
    if (!from || !to) return series;
    const map = new Map(series.map((p) => [p.date, p.total]));
    const out: SalesPoint[] = [];
    const end = new Date(to);
    let guard = 0;
    for (const d = new Date(from); d <= end && guard < 120; d.setDate(d.getDate() + 1), guard++) {
      const key = iso(d);
      out.push({ date: key, total: map.get(key) || 0, count: 0 });
    }
    return out;
  }, [s, computeRange]);

  if (denied) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full px-5 sm:px-8 lg:px-10 py-10">
          <h1 className="text-3xl font-bold text-slate-900">Hoş geldin{me?.userName ? `, ${me.userName}` : ''} 👋</h1>
          <p className="text-slate-500 mt-2">Sana atanmış işleri görmek için yan menüden ilerleyebilirsin.</p>
        </div>
      </div>
    );
  }

  const statusTotal = s?.statusCounts.reduce((a, x) => a + x.count, 0) || 0;

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Özet</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[['today', 'Bugün'], ['yesterday', 'Dün'], ['week', 'Hafta'], ['month', 'Ay'], ['all', 'Tümü'], ['custom', 'Özel']].map(([k, l]) => (
              <button key={k} onClick={() => setPreset(k)} className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${preset === k ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{l}</button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div><label className="text-xs font-medium text-slate-600">Başlangıç</label><input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="block mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="text-xs font-medium text-slate-600">Bitiş</label><input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="block mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <button onClick={load} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Uygula</button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm"><Spinner /></div>
        ) : (
          <>
            {/* Aksiyon akışı — ilgilenilmesi gerekenler */}
            {(() => {
              const cnt = (names: string[]) => (s?.statusCounts || []).filter((x) => names.includes(x.status)).reduce((a, x) => a + x.count, 0);
              const prepare = cnt(['Yeni', 'Onaylandı', 'Hazırlanıyor']);
              const road = cnt(['Kuryeye Verildi', 'Yola Çıktı']);
              const recv = s?.openReceivables ?? 0;
              const crit = s?.criticalStockCount ?? 0;
              const items = [
                prepare > 0 && { icon: ClipboardList, label: `${prepare} sipariş hazırlanacak`, color: 'amber', go: 'orders', opts: { focus: 'prepare' } },
                road > 0 && { icon: Truck, label: `${road} sipariş yolda`, color: 'indigo', go: 'orders', opts: { focus: 'road' } },
                recv > 0 && can(P.financeViewGeneralLedger) && { icon: Wallet, label: `${money(recv)} açık alacak`, color: 'rose', go: 'customer-ledger', opts: { focus: 'debit' } },
                crit > 0 && can(P.productsView) && { icon: AlertTriangle, label: `${crit} ürün kritik stok`, color: 'red', go: 'products-catalog', opts: {} },
              ].filter(Boolean) as { icon: LucideIcon; label: string; color: string; go: string; opts: Record<string, unknown> }[];
              if (items.length === 0) return null;
              const tone: Record<string, string> = {
                amber: 'bg-amber-50 text-amber-700 border-amber-100',
                indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                rose: 'bg-rose-50 text-rose-700 border-rose-100',
                red: 'bg-red-50 text-red-700 border-red-100',
              };
              return (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  {items.map((it, i) => (
                    <button key={i} onClick={() => onNavigate?.(it.go, it.opts)}
                      className={`flex items-center gap-3 border rounded-2xl px-4 py-3 text-left transition-transform active:scale-[0.98] ${tone[it.color]}`}>
                      <it.icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1 text-sm font-medium">{it.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-60" />
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Ana kartlar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5">
              <Card label="Sipariş" value={String(s?.orderCount ?? 0)} grad="from-blue-500 to-indigo-600" Icon={ClipboardList} />
              <Card label="Satış" value={money(s?.totalSales ?? 0)} grad="from-violet-500 to-purple-600" Icon={TrendingUp} small />
              <Card label="Tahsilat" value={money(s?.collected ?? 0)} grad="from-emerald-500 to-teal-600" Icon={HandCoins} small />
              <Card label="Açık Alacak" value={money(s?.openReceivables ?? 0)} grad="from-orange-500 to-rose-600" Icon={Wallet} small />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
              <Mini label="Net Kasa" value={money(s?.netCash ?? 0)} cls="text-slate-800" />
              <Mini label="Gider" value={money(s?.expenseTotal ?? 0)} cls="text-rose-600" />
              <Mini label="Kritik Stok" value={String(s?.criticalStockCount ?? 0)} cls={(s?.criticalStockCount ?? 0) > 0 ? 'text-red-600' : 'text-slate-700'} />
              <Mini label="Teslim Edilen" value={String(s?.statusCounts.find((x) => x.status === 'Teslim Edildi')?.count ?? 0)} cls="text-emerald-600" />
            </div>

            {/* Grafikler */}
            <div className="grid lg:grid-cols-2 gap-5 mb-5">
              {/* Satış grafiği (çizgi) */}
              <Panel title="Satış (Günlük)">
                {chartData.length === 0 ? <Empty /> : <SalesLineChart data={chartData} />}
              </Panel>
              {/* Sipariş durumları donut */}
              <Panel title="Sipariş Durumları">
                {statusTotal === 0 ? <Empty /> : <DonutChart data={s!.statusCounts} total={statusTotal} />}
              </Panel>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              {/* En çok satan */}
              <Panel title="En Çok Satılan Ürünler">
                {(s?.topProducts.length ?? 0) === 0 ? <Empty /> : <BarList items={s!.topProducts.map((p) => ({ label: p.name, sub: `×${p.quantity}`, value: p.total }))} />}
              </Panel>
              {/* En çok sipariş veren */}
              <Panel title="En Çok Sipariş Veren Müşteriler">
                {(s?.topCustomers.length ?? 0) === 0 ? <Empty /> : <BarList items={s!.topCustomers.map((c) => ({ label: c.name, sub: `${c.orderCount} sipariş`, value: c.total }))} color="#10b981" />}
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Grafikler ---- */
function DonutChart({ data, total }: { data: { status: string; count: number }[]; total: number }) {
  const C = 2 * Math.PI * 50;
  let acc = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {data.map((d, i) => {
            const frac = d.count / total;
            const seg = <circle key={i} cx="60" cy="60" r="50" fill="none" stroke={statusHex(d.status, i)} strokeWidth="16" strokeDasharray={`${frac * C} ${C - frac * C}`} strokeDashoffset={-acc * C} />;
            acc += frac;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-[11px] text-slate-400">sipariş</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusHex(d.status, i) }} /><span className="truncate text-slate-600">{d.status}</span></span>
            <span className="font-semibold text-slate-800">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesLineChart({ data }: { data: SalesPoint[] }) {
  const [hi, setHi] = useState<number | null>(null);
  const W = 520, H = 180, padX = 14, padTop = 18, padBot = 22;
  const max = Math.max(...data.map((p) => p.total), 1) * 1.15; // sıfır tabanlı + tepe boşluğu
  const n = data.length;
  const x = (i: number) => n <= 1 ? W / 2 : padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (v: number) => H - padBot - (v / max) * (H - padTop - padBot);
  const line = n === 1
    ? `${padX},${y(data[0].total)} ${W - padX},${y(data[0].total)}`
    : data.map((p, i) => `${x(i)},${y(p.total)}`).join(' ');
  const area = n === 1
    ? `${padX},${H - padBot} ${line} ${W - padX},${H - padBot}`
    : `${x(0)},${H - padBot} ${line} ${x(n - 1)},${H - padBot}`;
  const sel = hi != null ? data[hi] : null;
  const selX = sel ? (n === 1 ? W / 2 : x(hi!)) : 0;

  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* sıfır taban çizgisi */}
        <line x1={padX} y1={H - padBot} x2={W - padX} y2={H - padBot} stroke="#e2e8f0" strokeWidth="1" />
        <polygon points={area} fill="url(#salesFill)" />
        <polyline points={line} fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {sel && <line x1={selX} y1={padTop - 8} x2={selX} y2={H - padBot} stroke="#c7d2fe" strokeWidth="1" strokeDasharray="3 3" />}
        {data.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.total)} r={hi === i ? 5 : 3} fill="#4F46E5" />
            <rect x={x(i) - (n > 1 ? (W - 2 * padX) / (n - 1) / 2 : W / 2)} y={0} width={n > 1 ? (W - 2 * padX) / (n - 1) : W} height={H} fill="transparent"
              onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} onClick={() => setHi(hi === i ? null : i)} style={{ cursor: 'pointer' }} />
          </g>
        ))}
      </svg>
      {sel && (
        <div className="absolute -translate-x-1/2 -top-1 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow whitespace-nowrap pointer-events-none"
          style={{ left: `${(selX / W) * 100}%` }}>
          {dmy(sel.date)} · {money(sel.total)}
        </div>
      )}
      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
        <span>{data.length ? dm(data[0].date) : ''}</span>
        <span className="font-medium text-slate-600">Toplam {money(data.reduce((a, p) => a + p.total, 0))}</span>
        <span>{data.length ? dm(data[data.length - 1].date) : ''}</span>
      </div>
    </div>
  );
}

function BarList({ items, color = '#3b82f6' }: { items: { label: string; sub: string; value: number }[]; color?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-700 truncate">{i + 1}. {it.label} <span className="text-slate-400 text-xs">{it.sub}</span></span>
            <span className="font-medium text-slate-800 shrink-0 ml-2">{money(it.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: color }} /></div>
        </div>
      ))}
    </div>
  );
}

/* ---- Yardımcı bileşenler ---- */
function Card({ label, value, grad, Icon, small }: { label: string; value: string; grad: string; Icon: LucideIcon; small?: boolean }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="min-w-0"><div className={`font-bold tracking-tight text-slate-900 ${small ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} truncate`}>{value}</div><div className="text-xs text-slate-500">{label}</div></div>
    </div>
  );
}
function Mini({ label, value, cls }: { label: string; value: string; cls: string }) {
  return <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3"><div className={`text-lg font-bold ${cls}`}>{value}</div><div className="text-xs text-slate-500">{label}</div></div>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5"><h3 className="font-semibold text-slate-800 mb-4">{title}</h3>{children}</div>;
}
function Empty() { return <p className="text-sm text-slate-400 py-8 text-center">Veri yok.</p>; }
