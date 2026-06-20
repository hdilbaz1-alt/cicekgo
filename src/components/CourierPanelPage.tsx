'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { orderService, OrderItem } from '@/services/orderService';
import { getApiUrl, getEndpoint } from '@/config/api';
import { can, P } from '@/lib/permissions';
import { statusColor, payColor } from '@/lib/statusColors';
import { SkeletonList, EmptyState } from './ui/Skeleton';
import ContextMenu from './ContextMenu';
import CourierAssignModal from './CourierAssignModal';
import {
  Search, RefreshCw, Phone, MapPin, Clock, ChevronLeft, Package, StickyNote,
  CheckCircle2, Truck, XCircle, User,
} from 'lucide-react';

const money = (n?: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const fmt = (d?: string | null) => d ? new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const AVATAR_TONES = [
  'bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600', 'bg-violet-50 text-violet-600', 'bg-sky-50 text-sky-600',
];
const toneFor = (name: string) => AVATAR_TONES[(name.charCodeAt(0) || 0) % AVATAR_TONES.length];

const quickIcon = (q: string) => q === 'Teslim Edildi' ? CheckCircle2 : q === 'Teslim Edilemedi' ? XCircle : Truck;

function Spinner() {
  return <div className="flex justify-center py-16"><RefreshCw className="w-7 h-7 animate-spin text-indigo-600" /></div>;
}

export default function CourierPanelPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statuses, setStatuses] = useState<string[]>(['Yola Çıktı', 'Teslim Edildi', 'Teslim Edilemedi']);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<OrderItem | null>(null);
  const [detail, setDetail] = useState<OrderItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; order: OrderItem } | null>(null);
  const [assignOrder, setAssignOrder] = useState<OrderItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(); start.setDate(start.getDate() - 30);
      const end = new Date(); end.setDate(end.getDate() + 60);
      const res = await orderService.getMyAssigned({ startDate: iso(start), endDate: iso(end), page: 1, pageSize: 300 } as never);
      setOrders((res as { data?: { items?: OrderItem[] } })?.data?.items || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const r = await fetch(getApiUrl(getEndpoint('ORDER_STATUS_LIST')), { headers: { Authorization: `Bearer ${token}` } });
        const b = await r.json();
        const names = (b.data || []).map((s: { statusName: string }) => s.statusName);
        if (names.length) setStatuses(names);
      } catch { /* yoksay */ }
    })();
  }, []);

  const pick = useCallback(async (o: OrderItem) => {
    setSelected(o); setDetail(null); setDetailLoading(true);
    try { setDetail(await orderService.getOrderDetail(o.orderCode)); }
    catch { setDetail(o); }
    finally { setDetailLoading(false); }
  }, []);

  const setStatus = async (o: OrderItem, status: string) => {
    setBusyCode(o.orderCode);
    try {
      await orderService.changeStatus(o.orderCode, status);
      showToast('Durum güncellendi');
      await load();
      if (selected?.orderCode === o.orderCode) { const d = await orderService.getOrderDetail(o.orderCode).catch(() => null); if (d) { setSelected(d); setDetail(d); } }
    } catch { showToast('Güncellenemedi'); }
    finally { setBusyCode(null); }
  };

  const visible = useMemo(() => {
    let list = filter === 'open' ? orders.filter((o) => o.orderStatus !== 'Teslim Edildi' && o.orderStatus !== 'İptal Edildi') : orders;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((o) => [o.recipientName, o.recipientAddress, o.recipientPhone, o.orderCode].some((v) => (v || '').toLowerCase().includes(q)));
    return list;
  }, [orders, filter, query]);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Teslimatlarım</h1>
            <p className="text-slate-500 text-sm mt-0.5">{visible.length} teslimat</p>
          </div>
          <button onClick={load} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 active:scale-95"><RefreshCw className="w-5 h-5" /></button>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-5">
          {/* Liste */}
          <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col gap-3`}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ara: alıcı, adres, telefon, kod"
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setFilter('open')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${filter === 'open' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Bekleyen</button>
              <button onClick={() => setFilter('all')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Tümü</button>
            </div>

            {loading ? <SkeletonList rows={5} /> : visible.length === 0 ? (
              <EmptyState icon={<Truck className="w-7 h-7" />} title="Teslimat yok" hint={filter === 'open' ? 'Bekleyen teslimatın yok.' : 'Sana atanmış teslimat bulunmuyor.'} />
            ) : (
              <div className="space-y-2.5 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
                {visible.map((o) => (
                  <button key={o.orderCode} onClick={() => pick(o)}
                    onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, order: o }); }}
                    className={`w-full text-left bg-white rounded-2xl border shadow-sm p-3.5 transition-all active:scale-[0.99] hover:shadow-md ${selected?.orderCode === o.orderCode ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${toneFor(o.recipientName || o.orderCode)}`}>
                        {(o.recipientName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{o.recipientName || '—'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{o.orderCode}</div>
                          </div>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor(o.orderStatus)}`}>{o.orderStatus}</span>
                        </div>
                        {o.recipientAddress && <div className="mt-1.5 text-[13px] text-slate-600 line-clamp-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" />{o.recipientAddress}</div>}
                        <div className="mt-1.5 flex items-center justify-between text-[12px] text-slate-500">
                          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmt(o.deliveryDate)}{o.deliveryTimeRange ? ` · ${o.deliveryTimeRange}` : ''}</span>
                          <span className="font-semibold text-slate-700">{money(o.orderAmount)}</span>
                        </div>
                        <div className="mt-1.5 text-[12px] inline-flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          {o.assignedCourierName
                            ? <span className="text-indigo-600 font-medium">{o.assignedCourierName}</span>
                            : <span className="text-amber-600">Atanmadı</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detay */}
          <div className={`${selected ? 'block' : 'hidden lg:block'}`}>
            {!selected ? (
              <div className="hidden lg:flex h-full items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 min-h-[300px]">
                Soldan bir teslimat seçin.
              </div>
            ) : (
              <DeliveryDetail order={detail || selected} loading={detailLoading} statuses={statuses}
                busy={busyCode === (detail || selected).orderCode}
                onBack={() => setSelected(null)} onStatus={(s) => setStatus(selected, s)} canStatus={can(P.ordersChangeStatus)} />
            )}
          </div>
        </div>
      </div>
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} items={[
          ...(can(P.ordersAssignCourier) ? [{ label: menu.order.assignedCourierName ? 'Kuryeyi Değiştir' : 'Kurye Ata', icon: <Truck className="w-4 h-4 text-indigo-500" />, onClick: () => setAssignOrder(menu.order) }] : []),
          { label: 'Detayı Aç', icon: <User className="w-4 h-4 text-slate-400" />, onClick: () => pick(menu.order) },
        ]} />
      )}
      {assignOrder && (
        <CourierAssignModal order={assignOrder} onClose={() => setAssignOrder(null)}
          onAssigned={(m) => { setAssignOrder(null); showToast(m); load(); }} />
      )}
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function DeliveryDetail({ order, loading, statuses, busy, onBack, onStatus, canStatus }:
  { order: OrderItem; loading: boolean; statuses: string[]; busy: boolean; onBack: () => void; onStatus: (s: string) => void; canStatus: boolean }) {
  const quick = ['Yola Çıktı', 'Teslim Edildi', 'Teslim Edilemedi'];
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Başlık */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start gap-3">
        <button onClick={onBack} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 shrink-0"><ChevronLeft className="w-5 h-5" /></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 truncate">{order.recipientName || '—'}</h2>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor(order.orderStatus)}`}>{order.orderStatus}</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">{order.orderCode}</div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Hızlı aksiyonlar */}
          <div className="flex flex-wrap gap-2">
            {order.recipientPhone && <a href={`tel:${order.recipientPhone}`} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium"><Phone className="w-4 h-4" />Ara</a>}
            {order.recipientAddress && <a href={`https://maps.google.com/?q=${encodeURIComponent(order.recipientAddress)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium"><MapPin className="w-4 h-4" />Yol Tarifi</a>}
          </div>

          <Info icon={MapPin} label="Teslimat Adresi" value={order.recipientAddress || '-'} />
          <div className="grid grid-cols-2 gap-3">
            <Info icon={Phone} label="Alıcı Tel" value={order.recipientPhone || '-'} />
            <Info icon={Clock} label="Teslim Zamanı" value={`${fmt(order.deliveryDate)}${order.deliveryTimeRange ? ` · ${order.deliveryTimeRange}` : ''}`} />
          </div>
          <Info icon={User} label="Gönderici" value={`${order.senderName || '-'}${order.senderPhone ? ` · ${order.senderPhone}` : ''}`} />
          <Info icon={Truck} label="Kurye" value={order.assignedCourierName || 'Atanmadı'} />

          {/* Ürünler */}
          {(order.items?.length ?? 0) > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5"><Package className="w-4 h-4" />Ürünler</div>
              <div className="bg-slate-50 rounded-2xl divide-y divide-slate-100">
                {order.items!.map((it, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2 text-sm">
                    <span className="text-slate-700">{it.quantity} × {it.productName}</span>
                    <span className="text-slate-500">{money(it.totalPrice ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notlar */}
          {(order.cardNote || order.deliveryNote) && (
            <div className="space-y-2">
              {order.cardNote && <Info icon={StickyNote} label="Kart Notu" value={order.cardNote} />}
              {order.deliveryNote && <Info icon={StickyNote} label="Teslimat Notu" value={order.deliveryNote} />}
            </div>
          )}

          {/* Tutar */}
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
            <div>
              <div className="text-lg font-bold text-slate-900">{money(order.orderAmount)}</div>
              {order.orderRemainingAmount > 0 && <div className="text-xs text-orange-500">Tahsil edilecek: {money(order.orderRemainingAmount)}</div>}
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${payColor(order.paymentStatus)}`}>{order.paymentStatus || '—'}</span>
          </div>

          {/* Durum aksiyonları */}
          {canStatus && (
            <div className="pt-1">
              <div className="text-xs font-medium text-slate-500 mb-2">Durumu güncelle</div>
              <div className="flex flex-wrap gap-2">
                {quick.map((q) => {
                  const Icon = quickIcon(q);
                  const tone = q === 'Teslim Edildi' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : q === 'Teslim Edilemedi' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100';
                  return (
                    <button key={q} disabled={busy || order.orderStatus === q} onClick={() => onStatus(q)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 ${tone}`}>
                      <Icon className="w-3.5 h-3.5" />{q}
                    </button>
                  );
                })}
                {statuses.filter((s) => !quick.includes(s)).length > 0 && (
                  <select disabled={busy} value="" onChange={(e) => { if (e.target.value) onStatus(e.target.value); }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600">
                    <option value="">Diğer…</option>
                    {statuses.filter((s) => !quick.includes(s) && s !== order.orderStatus).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="text-sm text-slate-700 break-words">{value}</div>
      </div>
    </div>
  );
}
