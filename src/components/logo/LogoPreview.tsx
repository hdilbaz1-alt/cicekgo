'use client';
import { ImageOff } from 'lucide-react';

/** Logonun topbar'da nasıl görüneceğinin gerçek zamanlı önizlemesi (h-[37px], object-contain). */
export default function LogoPreview({ src, name }: { src?: string | null; name?: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-slate-600">Topbar Önizleme</span>
      <div className="mt-1.5 rounded-2xl border border-slate-200 overflow-hidden">
        {/* Topbar'ı taklit eden açık zemin bar */}
        <div className="h-14 px-4 bg-white/90 border-b border-slate-100 flex items-center gap-2.5">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-[37px] w-auto max-w-[150px] object-contain" />
          ) : (
            <span className="font-bold text-slate-900 truncate">{name || 'ÇiçekGo'}</span>
          )}
          <div className="ml-auto flex items-center gap-2 opacity-40">
            <div className="w-8 h-8 rounded-xl bg-slate-100" />
            <div className="w-8 h-8 rounded-full bg-slate-200" />
          </div>
        </div>
        {/* Şeffaflık kontrolü için koyu zemin şerit */}
        <div className="h-10 px-4 bg-slate-800 flex items-center">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-7 w-auto max-w-[120px] object-contain" />
          ) : (
            <span className="text-slate-500 text-xs inline-flex items-center gap-1"><ImageOff className="w-3.5 h-3.5" /> Logo yok</span>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-1">Açık ve koyu zeminde nasıl durduğunu kontrol edin.</p>
    </div>
  );
}
