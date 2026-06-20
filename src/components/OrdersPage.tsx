'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { orderService, OrderItem } from '@/services/orderService';
import { getApiUrl, getEndpoint } from '@/config/api';
import OrderFormModal from './OrderFormModal';
import OrderPrintModal from './OrderPrintModal';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import { SkeletonList } from './ui/Skeleton';
import { payColor } from '@/lib/statusColors';
import StatusBadge from './StatusBadge';
import CopyButton from './CopyButton';
import ContextMenu from './ContextMenu';
import CourierAssignModal from './CourierAssignModal';
import PaymentMethodSelect from './PaymentMethodSelect';
import { PaymentMethodDto } from '@/services/paymentMethodService';
import {
  Plus, Eye, CheckCircle2, Pencil, Trash2, ClipboardList, Wallet, Clock, X,
  Phone, MapPin, Printer, Truck, Copy, type LucideIcon,
} from 'lucide-react';

const money = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);


const FOCUS_PREPARE = ['Yeni', 'Onaylandı', 'Hazırlanıyor'];
const FOCUS_ROAD = ['Kuryeye Verildi', 'Yola Çıktı'];

// Dinamik kolonlar — "İşlem" kolonu bu listeye dahil DEĞİL (her zaman sabit, en sonda).
interface ColDef { key: string; label: string }
const ORDER_COLUMNS: ColDef[] = [
  { key: 'code', label: 'Kod' },
  { key: 'recipient', label: 'Alıcı' },
  { key: 'sender', label: 'Gönderici' },
  { key: 'delivery', label: 'Teslimat' },
  { key: 'amount', label: 'Tutar' },
  { key: 'status', label: 'Durum' },
  { key: 'payment', label: 'Ödeme' },
  { key: 'courier', label: 'Kurye' },
];
const DEFAULT_COL_ORDER = ORDER_COLUMNS.map((c) => c.key);
const COL_LABEL = Object.fromEntries(ORDER_COLUMNS.map((c) => [c.key, c.label]));
function colStorageKey(): string {
  try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return `cg_orders_cols_${u.userId ?? u.id ?? ''}`; } catch { return 'cg_orders_cols_'; }
}

// Telefonu uluslararası WhatsApp formatına çevir (TR varsayımı). Mesaj eklenmez → sadece sohbet açılır.
function waLink(phone?: string): string | null {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return null;
  let n = d;
  if (n.startsWith('90')) { /* zaten ülke kodlu */ }
  else if (n.startsWith('0')) n = '90' + n.slice(1);
  else if (n.length === 10) n = '90' + n;   // 5xxxxxxxxx
  return `https://wa.me/${n}`;
}

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02zM12.05 20.1h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.35c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  );
}

export default function OrdersPage({ onCreateOrder, isCreateModalOpen = false, onCloseModal = () => {}, focus, onNavigate }:
  { onCreateOrder?: () => void; isCreateModalOpen?: boolean; onCloseModal?: () => void; focus?: string; onNavigate?: (p: string, opts?: Record<string, unknown>) => void }) {
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [preset, setPreset] = useState<'yesterday' | 'today' | 'tomorrow' | 'week' | 'month' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState(ymd(new Date()));
  const [customTo, setCustomTo] = useState(ymd(new Date()));
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderItem | null>(null);
  const [statusOrder, setStatusOrder] = useState<OrderItem | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null);
  const [printOrder, setPrintOrder] = useState<OrderItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderItem | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; order: OrderItem } | null>(null);
  const [assignOrder, setAssignOrder] = useState<OrderItem | null>(null);
  const [query, setQuery] = useState('');
  const [statusF, setStatusF] = useState('');
  const [payF, setPayF] = useState('');
  const [courierF, setCourierF] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [focusGroup, setFocusGroup] = useState<string | null>(focus ?? null);
  // Dashboard'dan gelen odak (hazırlanacak / yolda): geniş aralığa al ve grupla filtrele
  useEffect(() => {
    if (focus) { setFocusGroup(focus); setPreset('month'); }
    else setFocusGroup(null);
  }, [focus]);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  // Dinamik kolon durumu (kullanıcı bazlı, localStorage) — "İşlem" hariç
  const [colOrder, setColOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [colHidden, setColHidden] = useState<string[]>([]);
  const [showCols, setShowCols] = useState(false);
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(colStorageKey());
      if (!raw) return;
      const s = JSON.parse(raw) as { order?: string[]; hidden?: string[] };
      const valid = (s.order || []).filter((k) => DEFAULT_COL_ORDER.includes(k));
      const missing = DEFAULT_COL_ORDER.filter((k) => !valid.includes(k));   // yeni eklenen kolonlar sona
      setColOrder([...valid, ...missing]);
      setColHidden((s.hidden || []).filter((k) => DEFAULT_COL_ORDER.includes(k)));
    } catch { /* yoksay */ }
  }, []);

  const persistCols = (order: string[], hidden: string[]) => {
    try { localStorage.setItem(colStorageKey(), JSON.stringify({ order, hidden })); } catch { /* yoksay */ }
  };
  const visibleCols = useMemo(() => colOrder.filter((k) => !colHidden.includes(k)), [colOrder, colHidden]);
  const toggleCol = (key: string) => setColHidden((prev) => { const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]; persistCols(colOrder, next); return next; });
  const resetCols = () => { setColOrder(DEFAULT_COL_ORDER); setColHidden([]); persistCols(DEFAULT_COL_ORDER, []); };
  const onColDrop = (target: string) => {
    if (!dragCol || dragCol === target) { setDragCol(null); setOverCol(null); return; }
    const next = [...colOrder];
    const from = next.indexOf(dragCol), to = next.indexOf(target);
    next.splice(from, 1); next.splice(to, 0, dragCol);
    setColOrder(next); persistCols(next, colHidden); setDragCol(null); setOverCol(null);
  };

  useEffect(() => { if (isCreateModalOpen) setCreateOpen(true); }, [isCreateModalOpen]);

  const range = useMemo(() => {
    const now = new Date();
    if (preset === 'today') return { from: ymd(now), to: ymd(now) };
    if (preset === 'yesterday') { const y = new Date(now); y.setDate(now.getDate() - 1); return { from: ymd(y), to: ymd(y) }; }
    if (preset === 'tomorrow') { const t = new Date(now); t.setDate(now.getDate() + 1); return { from: ymd(t), to: ymd(t) }; }
    if (preset === 'week') { const a = new Date(now); a.setDate(now.getDate() - 6); return { from: ymd(a), to: ymd(now) }; }
    if (preset === 'month') return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
    return { from: customFrom, to: customTo };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo]);

  const statusOptions = useMemo(() => Array.from(new Set(orders.map((o) => o.orderStatus).filter(Boolean))) as string[], [orders]);
  const payOptions = useMemo(() => Array.from(new Set(orders.map((o) => o.paymentStatus).filter(Boolean))) as string[], [orders]);
  const courierOptions = useMemo(() => Array.from(new Set(orders.map((o) => o.assignedCourierName).filter(Boolean))) as string[], [orders]);
  const filtered = useMemo(() => {
    let list = orders;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((o) =>
      [o.orderCode, o.recipientName, o.recipientPhone, o.senderName, o.senderPhone, o.recipientAddress, o.assignedCourierName]
        .some((v) => (v || '').toLowerCase().includes(q)));
    if (statusF) list = list.filter((o) => o.orderStatus === statusF);
    if (payF) list = list.filter((o) => o.paymentStatus === payF);
    if (courierF) list = list.filter((o) => (courierF === '__none__' ? !o.assignedCourierName : o.assignedCourierName === courierF));
    if (focusGroup === 'prepare') list = list.filter((o) => FOCUS_PREPARE.includes(o.orderStatus || ''));
    if (focusGroup === 'road') list = list.filter((o) => FOCUS_ROAD.includes(o.orderStatus || ''));
    return list;
  }, [orders, query, statusF, payF, courierF, focusGroup]);
  const hasFilter = !!(query || statusF || payF || courierF || focusGroup);

  const summary = useMemo(() => ({
    total: orders.length,
    delivered: orders.filter((o) => o.orderStatus === 'Teslim Edildi').length,
    amount: orders.reduce((s, o) => s + (o.orderAmount || 0), 0),
    remaining: orders.reduce((s, o) => s + (o.orderRemainingAmount || 0), 0),
  }), [orders]);

  const fetchOrders = useCallback(async (from: string, to: string) => {
    setLoading(true); setError(null);
    const ownOnly = can(P.ordersViewOwn) && !can(P.ordersView) && !can(P.ordersViewAll);
    try {
      const req = { startDate: from, endDate: to, page: 1, pageSize: 500 };
      const res = ownOnly ? await orderService.getMyAssigned(req) : await orderService.getOrders(req);
      if (res.success) setOrders(res.data.items); else setError(res.message || 'Yüklenemedi');
    } catch (e) { setError(e instanceof Error ? e.message : 'Bağlantı hatası'); }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(() => fetchOrders(range.from, range.to), [fetchOrders, range]);
  useEffect(() => { refresh(); }, [refresh]);

  const fmtDeliv = (s: string) => { try { return new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return s; } };

  // Dinamik kolon hücre içeriği
  const renderCell = (o: OrderItem, key: string) => {
    switch (key) {
      case 'code': return <span className="font-mono text-xs text-slate-700">{o.orderCode}</span>;
      case 'recipient': return (<><div className="font-medium text-slate-800">{o.recipientName || '-'}</div><div className="text-xs text-slate-400">{o.recipientPhone}</div></>);
      case 'sender': return (<><div className="font-medium text-slate-700">{o.senderName || '-'}</div>{o.senderPhone && <div className="text-xs text-slate-400">{o.senderPhone}</div>}</>);
      case 'delivery': return <span className="text-slate-600">{o.deliveryDate ? fmtDeliv(o.deliveryDate) : '-'}</span>;
      case 'amount': return (<><div className="font-semibold text-slate-800">{money(o.orderAmount)}</div>{o.orderRemainingAmount > 0 && <div className="text-xs text-orange-500">Kalan: {money(o.orderRemainingAmount)}</div>}</>);
      case 'status': return <StatusBadge status={o.orderStatus} />;
      case 'payment': return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${payColor(o.paymentStatus)}`}>{o.paymentStatus || '—'}</span>;
      case 'courier': return o.assignedCourierName
        ? <span className="inline-flex items-center gap-1.5 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{o.assignedCourierName}</span>
        : <span className="text-xs text-slate-300">—</span>;
      default: return null;
    }
  };
  // WhatsApp sohbeti aç (mesaj göndermeden). wa.me: uygulama varsa app, yoksa WhatsApp Web / mobil app.
  const openWhatsApp = (phone?: string) => {
    const u = waLink(phone);
    if (u) window.open(u, '_blank', 'noopener');
  };


  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Siparişler</h1>
          </div>
          {can(P.ordersCreate) && (
            <button onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 active:scale-95 transition-all">
              <Plus className="w-5 h-5" strokeWidth={2.4} />
              Yeni Sipariş
            </button>
          )}
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {/* Tarih filtresi */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {([['yesterday', 'Dün'], ['today', 'Bugün'], ['tomorrow', 'Yarın'], ['week', 'Hafta'], ['month', 'Ay'], ['custom', 'Özel']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setPreset(k)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${preset === k ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{l}</button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
              <span className="text-slate-400">–</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
            </div>
          )}
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Stat label="Toplam Sipariş" value={String(summary.total)} grad="from-blue-500 to-indigo-600" Icon={ClipboardList} />
          <Stat label="Teslim Edilen" value={String(summary.delivered)} grad="from-emerald-500 to-teal-600" Icon={CheckCircle2} />
          <Stat label="Toplam Tutar" value={money(summary.amount)} grad="from-violet-500 to-purple-600" Icon={Wallet} small />
          <Stat label="Kalan Tutar" value={money(summary.remaining)} grad="from-orange-500 to-rose-600" Icon={Clock} small />
        </div>

        {/* Arama & Filtre */}
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sipariş ara (alıcı, telefon, kod, adres…)"
                className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setShowFilter((v) => !v)} className={`px-4 py-2.5 rounded-2xl text-sm font-medium border ${hasFilter || showFilter ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>Filtre{hasFilter ? ' •' : ''}</button>
            <div className="relative hidden lg:block">
              <button onClick={() => setShowCols((v) => !v)} className={`px-4 py-2.5 rounded-2xl text-sm font-medium border ${showCols ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>Kolonlar</button>
              {showCols && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCols(false)} />
                  <div className="absolute right-0 mt-2 z-50 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2">
                    <div className="px-2 py-1.5 text-[11px] font-medium text-slate-400">Sürükleyerek sırala · göster/gizle</div>
                    {colOrder.map((key) => (
                      <div key={key} draggable
                        onDragStart={() => setDragCol(key)}
                        onDragOver={(e) => { e.preventDefault(); setOverCol(key); }}
                        onDragLeave={() => setOverCol((c) => (c === key ? null : c))}
                        onDrop={() => onColDrop(key)}
                        onDragEnd={() => { setDragCol(null); setOverCol(null); }}
                        className={`flex items-center gap-2 px-2 py-2 rounded-xl cursor-move select-none ${dragCol === key ? 'opacity-40' : ''} ${overCol === key ? 'ring-2 ring-indigo-200 bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                        <span className="text-slate-300">⋮⋮</span>
                        <label className="flex items-center gap-2 flex-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={!colHidden.includes(key)} onChange={() => toggleCol(key)} className="w-4 h-4 rounded accent-indigo-600" />
                          <span className="text-sm text-slate-700">{COL_LABEL[key]}</span>
                        </label>
                      </div>
                    ))}
                    <button onClick={resetCols} className="w-full mt-1 px-2 py-2 rounded-xl text-sm text-indigo-600 hover:bg-indigo-50 font-medium">Varsayılana dön</button>
                  </div>
                </>
              )}
            </div>
          </div>
          {showFilter && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap gap-3">
              <div>
                <label className="text-xs text-slate-500">Durum</label>
                <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="block mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <option value="">Tümü</option>
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Ödeme</label>
                <select value={payF} onChange={(e) => setPayF(e.target.value)} className="block mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <option value="">Tümü</option>
                  {payOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Kurye</label>
                <select value={courierF} onChange={(e) => setCourierF(e.target.value)} className="block mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <option value="">Tümü</option>
                  <option value="__none__">Atanmamış</option>
                  {courierOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {hasFilter && <button onClick={() => { setQuery(''); setStatusF(''); setPayF(''); setCourierF(''); setFocusGroup(null); }} className="self-end px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50">Temizle</button>}
            </div>
          )}
          {focusGroup && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                {focusGroup === 'prepare' ? 'Hazırlanacak siparişler' : 'Yoldaki siparişler'} ({filtered.length})
                <button onClick={() => setFocusGroup(null)} className="hover:opacity-80">✕</button>
              </span>
              <span className="text-xs text-slate-400">son 1 ay</span>
            </div>
          )}
        </div>

        {/* Liste */}
        {loading ? (
          <SkeletonList rows={6} />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-14 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-4 flex items-center justify-center text-white"><ClipboardList className="w-8 h-8" /></div>
            <h3 className="text-lg font-semibold text-slate-800">Sipariş yok</h3>
            <p className="text-slate-500 mt-1">{hasFilter ? 'Filtreye uyan sipariş bulunamadı.' : 'Seçili tarihte sipariş bulunmuyor.'}</p>
          </div>
        ) : (
          <>
            {/* Masaüstü tablo */}
            <div className="hidden lg:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left">
                    <tr>
                      {visibleCols.map((key) => <th key={key} className="px-4 py-3 font-medium">{COL_LABEL[key]}</th>)}
                      <th className="px-4 py-3 font-medium text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((o) => (
                      <tr key={o.orderPkId} className={o.customerId ? 'bg-indigo-50 hover:bg-indigo-100/70' : 'hover:bg-slate-50'}
                        onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, order: o }); }}>
                        {visibleCols.map((key) => <td key={key} className="px-4 py-3">{renderCell(o, key)}</td>)}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {o.recipientPhone && <button title="WhatsApp ile sohbet" onClick={() => openWhatsApp(o.recipientPhone)} className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50"><WaIcon className="w-[18px] h-[18px]" /></button>}
                            <Act title="Yazdır" onClick={() => setPrintOrder(o)} cls="text-indigo-600 hover:bg-indigo-50" Icon={Printer} />
                            <Act title="Detay" onClick={() => setDetailOrder(o)} cls="text-slate-500 hover:bg-slate-100" Icon={Eye} />
                            {can(P.ordersChangeStatus) && <Act title="Durum" onClick={() => setStatusOrder(o)} cls="text-amber-600 hover:bg-amber-50" Icon={CheckCircle2} />}
                            {can(P.ordersUpdate) && <Act title="Düzenle" onClick={() => setEditOrder(o)} cls="text-blue-600 hover:bg-blue-50" Icon={Pencil} />}
                            {can(P.ordersDelete) && <Act title="Sil" onClick={() => setDeleteTarget(o)} cls="text-red-500 hover:bg-red-50" Icon={Trash2} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobil kartlar */}
            <div className="lg:hidden space-y-3">
              {filtered.map((o) => (
                <div key={o.orderPkId} className={`rounded-2xl border shadow-sm p-3.5 ${o.customerId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`} onClick={() => setDetailOrder(o)}
                  onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, order: o }); }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate text-[15px]">{o.recipientName || '-'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{o.orderCode}</div>
                    </div>
                    <StatusBadge status={o.orderStatus} className="shrink-0" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-500">
                    {o.recipientPhone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{o.recipientPhone}</span>}
                    {o.deliveryDate && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtDeliv(o.deliveryDate)}</span>}
                    {o.assignedCourierName && <span className="inline-flex items-center gap-1 text-indigo-600"><MapPin className="w-3.5 h-3.5" />{o.assignedCourierName}</span>}
                  </div>
                  {o.senderName && (
                    <div className={`mt-1.5 text-[12px] ${o.customerId ? 'text-indigo-700 font-medium' : 'text-slate-500'}`}>
                      Gönderici: {o.senderName}{o.customerId ? ' · cari' : ''}
                    </div>
                  )}
                  <div className="mt-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{money(o.orderAmount)}</span>
                      {o.orderRemainingAmount > 0 && <span className="ml-2 text-xs text-orange-500">Kalan {money(o.orderRemainingAmount)}</span>}
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${payColor(o.paymentStatus)}`}>{o.paymentStatus || '—'}</span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {o.recipientPhone && <button title="WhatsApp" onClick={() => openWhatsApp(o.recipientPhone)} className="p-2 rounded-xl text-emerald-600 bg-emerald-50"><WaIcon className="w-[18px] h-[18px]" /></button>}
                    <Act title="Yazdır" onClick={() => setPrintOrder(o)} cls="text-indigo-600 bg-indigo-50" Icon={Printer} />
                    <Act title="Detay" onClick={() => setDetailOrder(o)} cls="text-slate-500 bg-slate-50" Icon={Eye} />
                    {can(P.ordersChangeStatus) && <Act title="Durum" onClick={() => setStatusOrder(o)} cls="text-amber-600 bg-amber-50" Icon={CheckCircle2} />}
                    {can(P.ordersUpdate) && <Act title="Düzenle" onClick={() => setEditOrder(o)} cls="text-blue-600 bg-blue-50" Icon={Pencil} />}
                    {can(P.ordersDelete) && <Act title="Sil" onClick={() => setDeleteTarget(o)} cls="text-red-500 bg-red-50" Icon={Trash2} />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <OrderFormModal isOpen={createOpen} onClose={() => { setCreateOpen(false); onCloseModal(); }} onSuccess={() => { showToast('Sipariş oluşturuldu'); refresh(); }} />
      <OrderFormModal isOpen={!!editOrder} order={editOrder} onClose={() => setEditOrder(null)} onSuccess={() => { showToast('Sipariş güncellendi'); refresh(); }} />
      {statusOrder && <StatusModal order={statusOrder} onClose={() => setStatusOrder(null)} onSaved={() => { setStatusOrder(null); showToast('Durum güncellendi'); refresh(); }} />}
      {detailOrder && <DetailModal order={detailOrder} onClose={() => setDetailOrder(null)} onToast={showToast} onPrint={() => { setPrintOrder(detailOrder); setDetailOrder(null); }} />}
      {printOrder && <OrderPrintModal order={printOrder} onClose={() => setPrintOrder(null)} />}
      {deleteTarget && (
        <DeleteOrderModal order={deleteTarget} onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); showToast('Sipariş silindi'); refresh(); }} />
      )}
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} items={[
          { label: 'Detayı aç', icon: <Eye className="w-4 h-4 text-slate-500" />, onClick: () => setDetailOrder(menu.order) },
          { label: 'Yazdır', icon: <Printer className="w-4 h-4 text-indigo-500" />, onClick: () => setPrintOrder(menu.order) },
          ...(can(P.ordersChangeStatus) ? [{ label: 'Durum güncelle', icon: <CheckCircle2 className="w-4 h-4 text-amber-500" />, onClick: () => setStatusOrder(menu.order) }] : []),
          ...(can(P.ordersUpdate) ? [{ label: 'Düzenle', icon: <Pencil className="w-4 h-4 text-blue-500" />, onClick: () => setEditOrder(menu.order) }] : []),
          ...(menu.order.customerId ? [{ label: 'Cari hesabına git', icon: <Wallet className="w-4 h-4 text-indigo-500" />, onClick: () => onNavigate?.('customer-ledger', { customerId: menu.order.customerId }) }] : []),
          ...(can(P.ordersAssignCourier) ? [{ label: menu.order.assignedCourierName ? 'Kuryeyi değiştir' : 'Kurye ata', icon: <Truck className="w-4 h-4 text-indigo-500" />, onClick: () => setAssignOrder(menu.order) }] : []),
          ...(can(P.ordersDelete) ? [{ label: 'Sil', icon: <Trash2 className="w-4 h-4 text-red-500" />, onClick: () => setDeleteTarget(menu.order), danger: true }] : []),
        ]} />
      )}
      {assignOrder && (
        <CourierAssignModal order={assignOrder} onClose={() => setAssignOrder(null)}
          onAssigned={(m) => { setAssignOrder(null); showToast(m); refresh(); }} />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function Stat({ label, value, grad, Icon, small }: { label: string; value: string; grad: string; Icon: LucideIcon; small?: boolean }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="min-w-0">
        <div className={`font-bold tracking-tight text-slate-900 ${small ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function Act({ title, onClick, cls, Icon }: { title: string; onClick: () => void; cls: string; Icon: LucideIcon }) {
  return (
    <button title={title} onClick={onClick} className={`p-2 rounded-xl transition-colors ${cls}`}>
      <Icon className="w-[18px] h-[18px]" />
    </button>
  );
}

function StatusModal({ order, onClose, onSaved }: { order: OrderItem; onClose: () => void; onSaved: () => void }) {
  const [opts, setOpts] = useState<string[]>(['Yeni', 'Hazırlanıyor', 'Hazır', 'Kuryeye Verildi', 'Yola Çıktı', 'Teslim Edildi', 'Teslim Edilemedi', 'İptal Edildi']);
  const [status, setStatus] = useState(order.orderStatus || 'Yeni');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEscClose(onClose);
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${getApiUrl(getEndpoint('ORDER_STATUS_LIST'))}`, { headers: { Authorization: `Bearer ${token}` } });
        const b = await res.json();
        const names = (b.data || []).map((x: { statusName: string }) => x.statusName);
        if (names.length) setOpts(names);
      } catch { /* yoksay */ }
    })();
  }, []);
  const save = async () => {
    setBusy(true);
    try { await orderService.changeStatus(order.orderCode, status, note); onSaved(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Güncellenemedi'); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <h3 className="text-lg font-bold mb-1">Durum Değiştir</h3>
        <p className="text-sm text-slate-500 mb-4">{order.orderCode}</p>
        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl mb-3" value={status} onChange={(e) => setStatus(e.target.value)}>
          {!opts.includes(status) && <option value={status}>{status}</option>}
          {opts.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl mb-4" placeholder="Not (opsiyonel)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={save} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? '…' : 'Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ order, onClose, onToast, onPrint }: { order: OrderItem; onClose: () => void; onToast: (m: string) => void; onPrint: () => void }) {
  const [detail, setDetail] = useState<OrderItem | null>(null);
  useEscClose(onClose);
  useEffect(() => { orderService.getOrderDetail(order.orderCode).then(setDetail).catch(() => setDetail(order)); }, [order]);
  const d = detail || order;
  const copyCode = async () => { try { await navigator.clipboard.writeText(d.orderCode); } catch { /* */ } onToast('Sipariş kodu kopyalandı'); };
  const fmtDay = (s?: string) => { try { return s ? new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : '-'; } catch { return s || '-'; } };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg sm:my-4 max-h-[92vh] overflow-y-auto">
        {/* Üst başlık */}
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 rounded-t-3xl z-10">
          <div className="min-w-0">
            <button onClick={copyCode} title="Kodu kopyala" className="group inline-flex items-center gap-1.5 text-sm font-mono font-semibold text-slate-700 hover:text-indigo-600">
              {d.orderCode}
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
            </button>
            <div className="mt-0.5"><StatusBadge status={d.orderStatus} /></div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={onPrint} title="Yazdır" className="w-9 h-9 flex items-center justify-center rounded-xl text-indigo-600 hover:bg-indigo-50"><Printer className="w-5 h-5" /></button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Teslimat zamanı şeridi */}
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-indigo-50/60 rounded-2xl px-4 py-2.5">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-medium text-slate-800">{fmtDay(d.deliveryDate)}</span>
            {d.deliveryTimeRange && <span className="text-slate-500">· {d.deliveryTimeRange}</span>}
          </div>

          {/* Alıcı / Gönderici kartları */}
          <div className="grid sm:grid-cols-2 gap-3">
            <PartyCard title="Alıcı" name={d.recipientName} phone={d.recipientPhone} onToast={onToast} />
            <PartyCard title="Gönderici" name={d.senderName} phone={d.senderPhone} onToast={onToast} />
          </div>

          {/* Adres */}
          {d.recipientAddress && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">Teslimat Adresi <CopyButton value={d.recipientAddress} onCopied={() => onToast('Adres kopyalandı')} /></div>
                  <div className="text-sm text-slate-700">{d.recipientAddress}</div>
                </div>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(d.recipientAddress)}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline shrink-0">Haritada</a>
              </div>
            </div>
          )}

          {/* Kart notu */}
          {d.cardNote && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-slate-700">
              <div className="text-[11px] text-amber-600 font-medium mb-0.5">Kart Notu</div>
              {d.cardNote}
            </div>
          )}

          {/* Ürünler */}
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1.5">Ürünler</div>
            <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
              {(d.items || []).map((it, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-700"><b className="text-slate-900">{it.quantity}×</b> {it.productName}</span>
                  <span className="text-slate-600">{money(it.totalPrice ?? 0)}</span>
                </div>
              ))}
              {(!d.items || d.items.length === 0) && <div className="px-4 py-3 text-center text-slate-400 text-sm">Kalem yok</div>}
            </div>
          </div>

          {/* Tutarlar */}
          <div className="bg-slate-50 rounded-2xl p-4 text-sm space-y-1.5">
            <Row label="Ara Toplam" value={money(d.subTotal ?? 0)} />
            {(d.discountTotal ?? 0) > 0 && <Row label="İndirim" value={'- ' + money(d.discountTotal ?? 0)} />}
            {(d.deliveryFee ?? 0) > 0 && <Row label="Teslimat" value={money(d.deliveryFee ?? 0)} />}
            {(d.extraFee ?? 0) > 0 && <Row label="Ek Ücret" value={money(d.extraFee ?? 0)} />}
            <div className="border-t border-slate-200 my-1.5" />
            <Row label="Genel Toplam" value={money(d.orderAmount)} bold />
            <Row label="Ödenen" value={money(d.totalPaid)} />
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Kalan</span>
              <span className="font-bold text-orange-600">{money(d.orderRemainingAmount)}</span>
            </div>
            <div className="pt-1"><span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${payColor(d.paymentStatus)}`}>{d.paymentStatus || '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyCard({ title, name, phone, onToast }: { title: string; name?: string; phone?: string; onToast: (m: string) => void }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <div className="text-[11px] text-slate-400 mb-1">{title}</div>
      <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
        <span className="truncate">{name || '—'}</span>
        {name && <CopyButton value={name} onCopied={() => onToast('Ad kopyalandı')} />}
      </div>
      {phone && (
        <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"><Phone className="w-3.5 h-3.5" />{phone}</a>
          <CopyButton value={phone} onCopied={() => onToast('Telefon kopyalandı')} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className="flex justify-between"><span className="text-slate-500">{label}</span><span className={bold ? 'font-bold text-slate-900' : 'text-slate-700'}>{value}</span></div>;
}

function DeleteOrderModal({ order, onClose, onDeleted }: { order: OrderItem; onClose: () => void; onDeleted: () => void }) {
  const paid = Math.max(0, (order.orderAmount || 0) - (order.orderRemainingAmount || 0));
  const [reason, setReason] = useState('Müşteri iptal etti');
  const [refunded, setRefunded] = useState<boolean | null>(paid > 0 ? null : true);
  const [planned, setPlanned] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [methodId, setMethodId] = useState<number | ''>('');
  const [pmList, setPmList] = useState<PaymentMethodDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEscClose(onClose);
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';

  const submit = async () => {
    if (!reason.trim()) return setErr('Silme sebebi gerekli');
    if (paid > 0 && refunded === null) return setErr('Ücret iade edildi mi seçin');
    if (paid > 0 && refunded === true && !methodId) return setErr('İade yöntemi seçin');
    setBusy(true); setErr('');
    try {
      await orderService.deleteOrder(order.orderCode, {
        reason: reason.trim(),
        feeRefunded: paid > 0 ? !!refunded : false,
        refundPlannedDate: paid > 0 && refunded === false ? new Date(`${planned}T12:00:00`).toISOString() : null,
        refundPaymentMethodId: paid > 0 && refunded === true ? (Number(methodId) || null) : null,
      });
      onDeleted();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Silinemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5" /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Siparişi Sil</h3>
            <p className="text-sm text-slate-500">{order.orderCode} · {order.recipientName || '—'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Silme Sebebi</label>
            <input className={inputCls + ' mt-1'} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </div>

          {paid > 0 ? (
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Müşterinin ödediği</span>
                <span className="font-bold text-slate-900">{money(paid)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-3">Ücret müşteriye iade edildi mi?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRefunded(true)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${refunded === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>Evet, iade edildi</button>
                <button type="button" onClick={() => setRefunded(false)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${refunded === false ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}>Hayır</button>
              </div>
              {refunded === false && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-slate-600">Planlanan İade Tarihi</label>
                  <input type="date" className={inputCls + ' mt-1'} value={planned} onChange={(e) => setPlanned(e.target.value)} />
                  <p className="text-[11px] text-slate-400 mt-1">Bu iade, Cari Hesaplar ve Kasa & Cari’de “bekleyen iade” olarak listelenir.</p>
                </div>
              )}
              {refunded === true && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-slate-600">İade Yöntemi *</label>
                  <PaymentMethodSelect value={methodId} onChange={setMethodId} methods={pmList} setMethods={setPmList} className={inputCls + ' mt-1'} />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-2xl px-4 py-3">Bu sipariş için ödeme alınmamış; iade gerekmez.</p>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={submit} disabled={busy} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Siliniyor…' : 'Siparişi Sil'}</button>
        </div>
      </div>
    </div>
  );
}
