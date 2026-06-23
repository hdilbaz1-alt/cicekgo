'use client';
import { Search, Bell } from 'lucide-react';

/** Logonun web sitesinde (üst barda) nasıl görüneceğinin canlı örneği — yalnız açık tema. */
export default function LogoPreview({ src, name }: { src?: string | null; name?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
      {/* Tarayıcı çubuğu */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <div className="ml-2 flex-1 h-5 rounded-md bg-white border border-slate-200 flex items-center px-2">
          <span className="text-[10px] text-slate-400 truncate">cicekgo.app</span>
        </div>
      </div>

      {/* Site üst barı — logo burada görünür */}
      <div className="h-14 px-4 bg-white border-b border-slate-100 flex items-center gap-2.5">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-[37px] w-auto max-w-[150px] object-contain" />
        ) : (
          <span className="font-bold text-slate-900 truncate">{name || 'ÇiçekGo'}</span>
        )}
        <div className="ml-auto flex items-center gap-2 text-slate-300">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100"><Search className="w-3.5 h-3.5" /><span className="w-12 h-2 rounded bg-slate-200" /></div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 grid place-items-center"><Bell className="w-4 h-4" /></div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
        </div>
      </div>

      {/* Sayfa gövdesi iskeleti (açık tema) */}
      <div className="flex">
        <div className="hidden sm:flex flex-col gap-2 w-28 p-3 border-r border-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-6 rounded-lg ${i === 0 ? 'bg-indigo-50' : 'bg-slate-50'}`} />
          ))}
        </div>
        <div className="flex-1 p-4 bg-slate-50/60 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-white border border-slate-100" />)}
          </div>
          <div className="h-24 rounded-xl bg-white border border-slate-100" />
        </div>
      </div>
    </div>
  );
}
