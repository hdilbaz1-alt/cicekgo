'use client';

import { canAny, getUser } from '@/lib/permissions';
import { NAV_GROUPS } from '@/lib/nav';
import { LogOut, type LucideIcon } from 'lucide-react';

/** Mobil "Menü" sayfası — sidebar yerine tüm sayfalara erişim (izin filtreli). */
export default function MorePage({ onNavigate, onLogout }: { onNavigate: (id: string) => void; onLogout: () => void }) {
  const user = getUser();
  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-white px-5 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg">
          {(user.userName || 'K').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{user.userName || 'Kullanıcı'}</div>
          <div className="text-xs text-slate-400">ÇiçekGo</div>
        </div>
      </div>

      {NAV_GROUPS.map((g) => {
        const items = g.items.filter((it) => it.id !== 'dashboard' && (!it.perm || canAny(...it.perm)));
        if (items.length === 0) return null;
        return (
          <div key={g.group} className="px-4 pt-5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">{g.group}</div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {items.map((it) => { const Icon: LucideIcon = it.icon; return (
                <button key={it.id} onClick={() => onNavigate(it.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left">
                  <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Icon className="w-[18px] h-[18px]" /></span>
                  <span className="text-sm font-medium text-slate-700">{it.label}</span>
                  <span className="ml-auto text-slate-300">›</span>
                </button>
              ); })}
            </div>
          </div>
        );
      })}

      <div className="px-4 py-6">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-red-100 text-red-600 font-semibold">
          <LogOut className="w-4 h-4" /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}
