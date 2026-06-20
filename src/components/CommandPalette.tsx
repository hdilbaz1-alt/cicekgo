'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { can, P } from '@/lib/permissions';
import { customerService, CustomerDetail } from '@/services/customerService';
import {
  Search, Plus, LayoutDashboard, ClipboardList, Truck, Users, UsersRound, BookText,
  Wallet, BarChart3, Package, UserCog, Trash2, ScrollText, Settings, CornerDownLeft, type LucideIcon,
} from 'lucide-react';

interface Cmd { id: string; label: string; icon: LucideIcon; perm?: string[]; kind: 'action' | 'page' }

const PAGES: Cmd[] = [
  { id: 'dashboard', label: 'Anasayfa', icon: LayoutDashboard, kind: 'page' },
  { id: 'orders', label: 'Siparişler', icon: ClipboardList, perm: [P.ordersView], kind: 'page' },
  { id: 'my-deliveries', label: 'Teslimatlarım', icon: Truck, perm: [P.ordersViewOwn], kind: 'page' },
  { id: 'customers', label: 'Müşteriler', icon: Users, perm: [P.customersView], kind: 'page' },
  { id: 'customer-groups', label: 'Müşteri Grupları', icon: UsersRound, perm: [P.customersView], kind: 'page' },
  { id: 'customer-ledger', label: 'Cari Hesaplar', icon: BookText, perm: [P.customersViewLedger, P.financeViewGeneralLedger], kind: 'page' },
  { id: 'finance', label: 'Kasa & Cari', icon: Wallet, perm: [P.financeViewGeneralLedger, P.financeViewCash], kind: 'page' },
  { id: 'reports', label: 'Raporlar', icon: BarChart3, perm: [P.reportsViewSales, P.reportsViewProducts, P.reportsViewCustomers, P.reportsViewCash, P.reportsViewCouriers], kind: 'page' },
  { id: 'products-catalog', label: 'Ürünler', icon: Package, perm: [P.productsView], kind: 'page' },
  { id: 'users', label: 'Kullanıcılar', icon: UserCog, perm: [P.usersManage], kind: 'page' },
  { id: 'deleted-orders', label: 'Silinen Siparişler', icon: Trash2, perm: [P.ordersViewDeleted], kind: 'page' },
  { id: 'audit-log', label: 'İşlem Kayıtları', icon: ScrollText, perm: [P.auditView], kind: 'page' },
  { id: 'store-hours', label: 'Çalışma Saatleri', icon: Settings, perm: [P.settingsManage], kind: 'page' },
  { id: 'print-templates', label: 'Yazdırma Şablonları', icon: Settings, perm: [P.settingsManage], kind: 'page' },
];

export default function CommandPalette({ open, onClose, onNavigate, onNewOrder }: {
  open: boolean; onClose: () => void; onNavigate: (id: string) => void; onNewOrder: () => void;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [custs, setCusts] = useState<CustomerDetail[]>([]);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => { if (open) { setQ(''); setActive(0); setCusts([]); } }, [open]);

  // Müşteri canlı arama (yetki varsa)
  useEffect(() => {
    if (!open || !q.trim() || !can(P.customersView)) { setCusts([]); return; }
    const t = setTimeout(async () => {
      try { const r = await customerService.getCustomers(q.trim(), 1, 6); setCusts(r.items); } catch { setCusts([]); }
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const actions: Cmd[] = useMemo(() => [
    ...(can(P.ordersCreate) ? [{ id: '__new_order', label: 'Yeni Sipariş oluştur', icon: Plus, kind: 'action' as const }] : []),
    ...(can(P.customersCreate) ? [{ id: '__new_customer', label: 'Yeni Müşteri ekle', icon: Plus, kind: 'action' as const }] : []),
  ], []);

  const pages = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return PAGES.filter((p) => (!p.perm || p.perm.some((c) => can(c))) && (!ql || p.label.toLowerCase().includes(ql)));
  }, [q]);

  const filteredActions = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return actions.filter((a) => !ql || a.label.toLowerCase().includes(ql));
  }, [actions, q]);

  // Düz liste (klavye navigasyonu için)
  const flat = useMemo(() => [
    ...filteredActions.map((a) => ({ type: 'cmd' as const, cmd: a })),
    ...pages.map((p) => ({ type: 'cmd' as const, cmd: p })),
    ...custs.map((c) => ({ type: 'customer' as const, customer: c })),
  ], [filteredActions, pages, custs]);

  useEffect(() => { if (active >= flat.length) setActive(0); }, [flat.length, active]);

  const run = (i: number) => {
    const item = flat[i];
    if (!item) return;
    if (item.type === 'customer') { onNavigate('customers'); onClose(); return; }
    const c = item.cmd;
    if (c.id === '__new_order') onNewOrder();
    else if (c.id === '__new_customer') onNavigate('customers');
    else onNavigate(c.id);
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal((
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[12vh]" onKeyDown={(e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); run(active); }
    }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder="Ara veya bir komut yaz…"
            className="flex-1 py-4 text-[15px] outline-none placeholder:text-slate-400" />
          <kbd className="text-[11px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {flat.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-400">Sonuç yok.</div>}

          {filteredActions.length > 0 && <Group label="Hızlı işlem" />}
          {flat.map((item, i) => {
            const prevType = i > 0 ? flat[i - 1].type : null;
            const showPagesHdr = item.type === 'cmd' && item.cmd.kind === 'page' && (i === 0 || (flat[i - 1].type === 'cmd' && (flat[i - 1] as { cmd: Cmd }).cmd.kind === 'action'));
            const showCustHdr = item.type === 'customer' && prevType !== 'customer';
            return (
              <div key={i}>
                {showPagesHdr && <Group label="Sayfalar" />}
                {showCustHdr && <Group label="Müşteriler" />}
                {item.type === 'cmd' ? (
                  <Row active={i === active} onMouseEnter={() => setActive(i)} onClick={() => run(i)}
                    icon={<item.cmd.icon className="w-[18px] h-[18px]" />} label={item.cmd.label}
                    accent={item.cmd.kind === 'action'} />
                ) : (
                  <Row active={i === active} onMouseEnter={() => setActive(i)} onClick={() => run(i)}
                    icon={<span className="w-[18px] h-[18px] rounded-full bg-indigo-100 text-indigo-600 text-[11px] font-bold flex items-center justify-center">{item.customer.customerName.charAt(0).toUpperCase()}</span>}
                    label={item.customer.customerName} hint={item.customer.phone || ''} />
                )}
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> seç</span>
          <span>↑↓ gez</span>
          <span className="ml-auto">⌘K / Ctrl-K</span>
        </div>
      </div>
    </div>
  ), document.body);
}

function Group({ label }: { label: string }) {
  return <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>;
}

function Row({ active, onClick, onMouseEnter, icon, label, hint, accent }: {
  active: boolean; onClick: () => void; onMouseEnter: () => void; icon: React.ReactNode; label: string; hint?: string; accent?: boolean;
}) {
  return (
    <button onClick={onClick} onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${active ? 'bg-indigo-50' : ''}`}>
      <span className={`${accent ? 'text-indigo-600' : 'text-slate-400'}`}>{icon}</span>
      <span className={`flex-1 truncate ${accent ? 'text-indigo-700 font-medium' : 'text-slate-700'}`}>{label}</span>
      {hint ? <span className="text-xs text-slate-400 truncate max-w-[40%]">{hint}</span> : null}
    </button>
  );
}
