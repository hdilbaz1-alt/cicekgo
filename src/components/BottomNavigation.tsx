'use client';

import { can, P } from '@/lib/permissions';
import { LayoutDashboard, ClipboardList, Truck, Users, Wallet, Menu, type LucideIcon } from 'lucide-react';

interface BottomNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onSidebarToggle?: () => void;
}

export default function BottomNavigation({ currentPage, onPageChange }: BottomNavigationProps) {
  const dyn: { id: string; label: string; icon: LucideIcon; show: boolean }[] = [
    { id: 'dashboard', label: 'Anasayfa', icon: LayoutDashboard, show: true },
    { id: 'orders', label: 'Siparişler', icon: ClipboardList, show: can(P.ordersView) },
    { id: 'my-deliveries', label: 'Teslimat', icon: Truck, show: can(P.ordersViewOwn) && !can(P.ordersView) },
    { id: 'customers', label: 'Müşteriler', icon: Users, show: can(P.customersView) },
    { id: 'finance', label: 'Kasa', icon: Wallet, show: can(P.financeViewGeneralLedger) || can(P.financeViewCash) },
  ].filter((x) => x.show).slice(0, 4);

  const items = [...dyn, { id: 'more', label: 'Menü', icon: Menu, show: true }];
  const moreActive = (id: string) => id === 'more' && !dyn.some((d) => d.id === currentPage);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id || moreActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10.5px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
