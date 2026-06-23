'use client';
import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { removeBackground } from '@/lib/imageUtils';

/**
 * "Arka planı kaldır" — tamamen tarayıcıda (canvas) çalışır, dış servise dosya gönderilmez.
 * Düz/tek renk (özellikle beyaz) zeminli logolarda şeffaf PNG üretir. Başarısızsa orijinali korur.
 */
export default function BackgroundRemovalAction({ src, onResult, onMessage }: {
  src: string;
  onResult: (dataUrl: string) => void;
  onMessage?: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const out = await removeBackground(src);
      onResult(out);
      onMessage?.('Arka plan kaldırıldı ✓');
    } catch {
      onMessage?.('Arka plan kaldırılamadı, orijinal logo korundu.');
    } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={run} disabled={busy}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl disabled:opacity-50">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
      {busy ? 'Kaldırılıyor…' : 'Arka planı kaldır'}
    </button>
  );
}
