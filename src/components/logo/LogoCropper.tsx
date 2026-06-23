'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Check, X, Move } from 'lucide-react';
import { loadImage, renderCrop } from '@/lib/imageUtils';
import { useEscClose } from '@/lib/useEscClose';

const FRAME_W = 288;
const ASPECTS: { key: string; label: string; r: number }[] = [
  { key: '1', label: '1:1', r: 1 },
  { key: '43', label: '4:3', r: 4 / 3 },
  { key: '169', label: '16:9', r: 16 / 9 },
  { key: '41', label: 'Geniş', r: 4 },
];

/** Canva benzeri basit kırpma: yakınlaştır, sürükle, oran seç. Çıktı şeffaf PNG (data URL). */
export default function LogoCropper({ src, onCancel, onDone }: { src: string; onCancel: () => void; onDone: (dataUrl: string) => void }) {
  useEscClose(onCancel);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState(ASPECTS[0].r);
  const [fit, setFit] = useState(1);          // çerçeveyi kaplayan minimum ölçek
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const frameH = Math.round(FRAME_W / aspect);

  // Görseli yükle
  useEffect(() => { loadImage(src).then((img) => setNat({ w: img.naturalWidth, h: img.naturalHeight })).catch(() => onCancel()); }, [src, onCancel]);

  // Oran/görsel değişince "cover" şekilde ortala
  const recenter = useCallback(() => {
    if (!nat) return;
    const f = Math.max(FRAME_W / nat.w, frameH / nat.h);
    setFit(f); setScale(f);
    setOffset({ x: (FRAME_W - nat.w * f) / 2, y: (frameH - nat.h * f) / 2 });
  }, [nat, frameH]);
  useEffect(() => { recenter(); }, [recenter]);

  const applyScale = (next: number) => {
    const s = Math.max(fit * 0.5, Math.min(fit * 5, next));
    setOffset((o) => ({
      x: FRAME_W / 2 - ((FRAME_W / 2 - o.x) / scale) * s,
      y: frameH / 2 - ((frameH / 2 - o.y) / scale) * s,
    }));
    setScale(s);
  };

  const onPointerDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; (e.target as HTMLElement).setPointerCapture(e.pointerId); };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  const confirm = async () => {
    if (!nat) return;
    setBusy(true);
    try { onDone(await renderCrop(src, { frameW: FRAME_W, frameH, scale, offsetX: offset.x, offsetY: offset.y })); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92dvh] overflow-y-auto p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Logoyu Kırp</h3>
          <button onClick={onCancel} className="w-9 h-9 grid place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        {/* Kırpma alanı */}
        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] touch-none cursor-grab active:cursor-grabbing select-none"
            style={{ width: FRAME_W, height: frameH }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          >
            {nat && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" draggable={false}
                style={{ position: 'absolute', left: offset.x, top: offset.y, width: nat.w * scale, height: nat.h * scale, maxWidth: 'none' }} />
            )}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1"><Move className="w-3 h-3" /> Sürükleyerek konumlandır</p>

        {/* Zoom */}
        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => applyScale(scale - fit * 0.25)} className="w-9 h-9 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0"><ZoomOut className="w-4 h-4" /></button>
          <input type="range" min={fit * 0.5} max={fit * 5} step={fit * 0.02} value={scale} onChange={(e) => applyScale(parseFloat(e.target.value))} className="flex-1 accent-indigo-600" />
          <button onClick={() => applyScale(scale + fit * 0.25)} className="w-9 h-9 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0"><ZoomIn className="w-4 h-4" /></button>
        </div>

        {/* Oran */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {ASPECTS.map((a) => (
            <button key={a.key} onClick={() => setAspect(a.r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${Math.abs(aspect - a.r) < 0.001 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{a.label}</button>
          ))}
          <button onClick={recenter} className="ml-auto px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100">Sıfırla</button>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={confirm} disabled={busy || !nat} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50"><Check className="w-4 h-4" />{busy ? 'İşleniyor…' : 'Kırp ve Kullan'}</button>
        </div>
      </div>
    </div>
  );
}
