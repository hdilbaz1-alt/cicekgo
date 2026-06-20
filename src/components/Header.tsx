'use client';

import { useEffect, useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut, User as UserIcon, Search } from 'lucide-react';
import ProfileModal from './ProfileModal';

interface HeaderProps {
  user: { name: string; email: string; userName?: string } | null;
  onLogout: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  title?: string;
}

export default function Header({ user, onLogout, onMenuClick, onSearchClick, title }: HeaderProps) {
  const [dropdown, setDropdown] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tenant, setTenant] = useState<{ name?: string; lkStart?: string; lkEnd?: string; isExpired?: boolean; logoBase64?: string | null; logoRemoveBg?: boolean } | null>(null);
  const [remainingDays, setRemainingDays] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('tenantInfo');
    if (!stored) return;
    try {
      const info = JSON.parse(stored);
      setTenant(info);
      if (info.lkEnd) setRemainingDays(Math.max(0, Math.ceil((new Date(info.lkEnd).getTime() - Date.now()) / 86400000)));
    } catch { /* yoksay */ }
  }, []);

  const initials = (() => {
    const n = user?.userName || '';
    if (!n) return 'U';
    const p = n.split(/[.\s]/);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || n[0].toUpperCase();
  })();

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
          {remainingDays > 0 && remainingDays <= 7 && (
            <span className="hidden sm:inline text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">Lisans {remainingDays} gün</span>
          )}
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Bell className="w-5 h-5" />
          </button>

          <div className="relative">
            <button onClick={() => setDropdown((v) => !v)} className="flex items-center gap-2 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-xl hover:bg-slate-100">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center">{initials}</span>
              <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">{user?.userName || 'Kullanıcı'}</span>
              <ChevronDown className="hidden sm:block w-4 h-4 text-slate-400" />
            </button>
            {dropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdown(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-800 truncate">{tenant?.name || 'ÇiçekGo'}</div>
                    <div className="text-xs text-slate-400 truncate">{user?.userName}</div>
                  </div>
                  <button onClick={() => { setDropdown(false); setProfileOpen(true); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <UserIcon className="w-4 h-4 text-slate-400" /> Profil
                  </button>
                  <button onClick={() => { setDropdown(false); onLogout(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} tenantInfo={tenant as never} remainingDays={remainingDays} />
    </header>
  );
}
