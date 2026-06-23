'use client';
import { useRef, useState } from 'react';
import { Upload, Crop, Trash2, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, fileToDataUrl } from '@/lib/imageUtils';
import LogoCropper from './LogoCropper';
import LogoPreview from './LogoPreview';
import BackgroundRemovalAction from './BackgroundRemovalAction';

/** Logo yükleme + kırpma + önizleme + arka plan kaldırma — tek reusable bileşen. */
export default function LogoUploader({ value, name, onChange, onMessage, showPreview = true }: {
  value: string | null;
  name?: string;
  onChange: (dataUrl: string | null) => void;
  onMessage: (msg: string) => void;
  showPreview?: boolean;
}) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (file?: File | null) => {
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) return onMessage(v.error || 'Geçersiz dosya');
    try { setCropSrc(await fileToDataUrl(file)); } catch { onMessage('Dosya okunamadı'); }
  };

  return (
    <div>
      <span className="text-xs font-medium text-slate-600">Logo</span>

      {/* Yükleme alanı / mevcut logo */}
      <div className="mt-1.5 flex items-start gap-3">
        <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-slate-50 grid place-items-center overflow-hidden shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-w-full max-h-full object-contain" />
          ) : <ImageIcon className="w-7 h-7 text-slate-300" />}
        </div>

        <div className="flex-1 min-w-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files?.[0]); }}
            className={`rounded-2xl border-2 border-dashed px-4 py-3 text-center transition-colors cursor-pointer ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Sürükle-bırak veya <span className="text-indigo-600 font-medium">dosya seç</span></p>
            <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP · en fazla 4MB</p>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.currentTarget.value = ''; }} />
          </div>

          {value && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button type="button" onClick={() => setCropSrc(value)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl"><Crop className="w-4 h-4" /> Yeniden kırp</button>
              <BackgroundRemovalAction src={value} onResult={(d) => onChange(d)} onMessage={onMessage} />
              <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl"><Trash2 className="w-4 h-4" /> Kaldır</button>
            </div>
          )}
        </div>
      </div>

      {/* Topbar önizleme (opsiyonel — dışarıda da gösterilebilir) */}
      {showPreview && <div className="mt-4"><LogoPreview src={value} name={name} /></div>}

      {cropSrc && <LogoCropper src={cropSrc} onCancel={() => setCropSrc(null)} onDone={(d) => { onChange(d); setCropSrc(null); onMessage('Logo güncellendi (kaydetmeyi unutmayın)'); }} />}
    </div>
  );
}
