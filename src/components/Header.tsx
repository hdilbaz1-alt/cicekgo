'use client';

import { useEffect, useState } from 'react';
import { Menu, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNavigate?: (page: string, opts?: Record<string, unknown>) => void;
  title?: string;
}

export default function Header({ onMenuClick, onSearchClick, onNavigate, title }: HeaderProps) {
  const [tenant, setTenant] = useState<{ name?: string; logoBase64?: string | null; logoRemoveBg?: boolean } | null>(null);

  useEffect(() => {
    const read = () => {
      const stored = localStorage.getItem('tenantInfo');
      if (!stored) return;
      try { setTenant(JSON.parse(stored)); } catch { /* yoksay */ }
    };
    read();
    // Firma logosu/adı kaydedilince topbar'ı anında güncelle
    window.addEventListener('tenantinfo:update', read);
    return () => window.removeEventListener('tenantinfo:update', read);
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
      <div className="h-16 px-3 sm:px-5 flex items-center gap-3">
        {/* Mobile menu */}
        <button onClick={onMenuClick} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 active:scale-95">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo / title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {tenant?.logoBase64 ? (
            <img src={tenant.logoBase64} alt="" className="h-[37px] w-auto max-w-[150px] object-contain" style={tenant.logoRemoveBg ? { mixBlendMode: 'multiply' } : undefined} />
          ) : (
            <span className="hidden sm:block font-bold text-slate-900 truncate">{tenant?.name || 'ÇiçekGo'}</span>
          )}
          {title && <span className="lg:hidden font-semibold text-slate-800 truncate">{title}</span>}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Genel arama / komut paleti */}
          <button onClick={onSearchClick} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm">
            <Search className="w-4 h-4" />
            <span>Ara…</span>
            <kbd className="text-[11px] border border-slate-300 rounded px-1">⌘K</kbd>
          </button>
          <button onClick={onSearchClick} className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><Search className="w-5 h-5" /></button>

          {/* Bildirim zili (dropdown) */}
          {onNavigate && <NotificationBell onNavigate={onNavigate} />}
        </div>
      </div>
    </header>
  );
}
