'use client';

import { useEffect, useState } from 'react';
import { canAny, P } from '@/lib/permissions';
import {
  LayoutDashboard, ClipboardList, Truck, Users, UsersRound, BookText, Wallet,
  BarChart3, Package, UserCog, Trash2, ScrollText, Settings, ChevronRight,
  ChevronsLeft, Tag, Ruler, Clock, ListChecks, Printer, RotateCcw, type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onPageChange: (page: string) => void;
  currentPage: string;
  onCreateOrder?: () => void;
}

interface SubItem { id: string; label: string; icon: LucideIcon }
interface Item { id: string; label: string; icon: LucideIcon; perm?: string[]; group?: string; submenu?: SubItem[] }

const ITEMS: Item[] = [
  { id: 'dashboard', label: 'Anasayfa', icon: LayoutDashboard, group: 'Genel' },
  { id: 'orders', label: 'Siparişler', icon: ClipboardList, perm: [P.ordersView], group: 'Operasyon' },
  { id: 'my-deliveries', label: 'Teslimatlarım', icon: Truck, perm: [P.ordersViewOwn], group: 'Operasyon' },
  { id: 'customers', label: 'Müşteriler', icon: Users, perm: [P.customersView], group: 'Operasyon' },
  { id: 'customer-groups', label: 'Müşteri Grupları', icon: UsersRound, perm: [P.customersView], group: 'Operasyon' },
  { id: 'customer-ledger', label: 'Cari Hesaplar', icon: BookText, perm: [P.customersViewLedger, P.financeViewGeneralLedger], group: 'Para' },
  { id: 'non-cari', label: 'Cari Olmayanlar', icon: RotateCcw, perm: [P.financeViewGeneralLedger], group: 'Para' },
  { id: 'finance', label: 'Kasa & Cari', icon: Wallet, perm: [P.financeViewGeneralLedger, P.financeViewCash], group: 'Para' },
  { id: 'reports', label: 'Raporlar', icon: BarChart3, perm: [P.reportsViewSales, P.reportsViewProducts, P.reportsViewCustomers, P.reportsViewCash, P.reportsViewCouriers], group: 'Para' },
  { id: 'products-catalog', label: 'Ürünler', icon: Package, perm: [P.productsView], group: 'Katalog' },
  { id: 'users', label: 'Kullanıcılar', icon: UserCog, perm: [P.usersManage], group: 'Yönetim' },
  { id: 'deleted-orders', label: 'Silinen Siparişler', icon: Trash2, perm: [P.ordersViewDeleted], group: 'Yönetim' },
  { id: 'audit-log', label: 'İşlem Kayıtları', icon: ScrollText, perm: [P.auditView], group: 'Yönetim' },
  {
    id: 'settings', label: 'Ayarlar', icon: Settings, perm: [P.settingsManage], group: 'Yönetim',
    submenu: [
      { id: 'order-codes', label: 'Sipariş Kodları', icon: Tag },
      { id: 'units', label: 'Birim Ayarları', icon: Ruler },
      { id: 'store-hours', label: 'Çalışma Saatleri', icon: Clock },
      { id: 'order-status', label: 'Sipariş Durumları', icon: ListChecks },
      { id: 'print-templates', label: 'Yazdırma Şablonları', icon: Printer },
      { id: 'payment-methods', label: 'Ödeme Yöntemleri', icon: Wallet },
    ],
  },
];

export default function Sidebar({ isCollapsed, onToggle, onPageChange, currentPage }: SidebarProps) {
  const [showSub, setShowSub] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Masaüstünde kapalıyken üzerine gelince geçici aç
  const expanded = !isCollapsed || hovered;
  // expanded=false iken yalnız lg ekranlarda daralt (mobil drawer hep tam)
  const hideOnCollapse = expanded ? '' : 'lg:hidden';
  const items = mounted ? ITEMS.filter((i) => !i.perm || canAny(...i.perm)) : [];
  const subActive = (sub?: SubItem[]) => sub?.some((s) => s.id === currentPage);

  const go = (id: string) => { onPageChange(id); setHovered(false); };

  return (
    <div
      onMouseEnter={() => isCollapsed && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white border-r border-slate-200 text-slate-700 flex flex-col h-full overflow-hidden transition-[width] duration-300 shadow-sm w-64 ${expanded ? 'lg:w-64' : 'lg:w-[84px]'}`}
    >
      {/* Brand: sadece firma logosu */}
      <div className={`h-16 border-b border-slate-100 flex items-center gap-2 ${expanded ? 'px-4' : 'lg:px-2 px-4'}`}>
        <div className="flex-1 flex items-center min-w-0">
          <img src="/cicekgologo.png" alt="ÇiçekGo" className="h-8 w-auto max-w-full object-contain object-left" />
        </div>
        <button onClick={onToggle} className={`hidden lg:flex w-8 h-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0 ${hideOnCollapse}`}>
          <ChevronsLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const active = currentPage === item.id || (!!item.submenu && subActive(item.submenu));
          const showGroup = expanded && item.group && item.group !== 'Genel' && (idx === 0 || items[idx - 1].group !== item.group);
          return (
            <div key={item.id}>
              {showGroup && <div className="px-3 pt-3 pb-1 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wide">{item.group}</div>}
              <button
                onClick={() => (item.submenu ? setShowSub((v) => !v) : go(item.id))}
                title={!expanded ? item.label : undefined}
                className={`group w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                  active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                } ${expanded ? '' : 'lg:justify-center'}`}
              >
                <Icon className={`w-[21px] h-[21px] shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={active ? 2.4 : 2} />
                <span className={`flex-1 text-[14.5px] truncate ${hideOnCollapse}`}>{item.label}</span>
                {item.submenu && <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showSub ? 'rotate-90' : ''} ${hideOnCollapse}`} />}
              </button>

              {item.submenu && expanded && (
                <div className={`overflow-hidden transition-all duration-300 ${showSub ? 'max-h-72 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-4 pl-3 border-l border-slate-100 space-y-0.5">
                    {item.submenu.map((s) => {
                      const SIcon = s.icon;
                      const sActive = currentPage === s.id;
                      return (
                        <button key={s.id} onClick={() => go(s.id)}
                          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] transition-colors ${
                            sActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100'
                          }`}>
                          <SIcon className="w-4 h-4 shrink-0" strokeWidth={2} />
                          <span className="truncate">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={`px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400 ${hideOnCollapse}`}>ÇiçekGo · v1</div>
    </div>
  );
}
