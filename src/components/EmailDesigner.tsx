'use client';

import { useEffect, useRef, useState } from 'react';
import {
  EmailDoc, EmEl, EmType, EMAIL_TOKENS, EMAIL_PRESETS, EMAIL_WIDTHS,
  EmailDocRenderer, newEmailEl, blankEmailDoc, parseEmailDoc, buildEmailHtml, companyLogo,
} from '@/lib/emailDoc';
import { emailService, type EmailTemplate } from '@/services/emailService';
import {
  Type, Heading1, MousePointerClick, Image as ImageIcon, Minus, Square, Table, Database, Trash2,
  ZoomIn, ZoomOut, Eye, EyeOff, Save, X, ChevronUp, ChevronDown, LayoutTemplate,
} from 'lucide-react';

const TOOLS: { type: EmType; label: string; Icon: typeof Type }[] = [
  { type: 'text', label: 'Metin', Icon: Type },
  { type: 'heading', label: 'Başlık', Icon: Heading1 },
  { type: 'button', label: 'Buton', Icon: MousePointerClick },
  { type: 'image', label: 'Görsel / Logo', Icon: ImageIcon },
  { type: 'divider', label: 'Çizgi', Icon: Minus },
  { type: 'box', label: 'Kutu', Icon: Square },
  { type: 'items', label: 'Ürün Listesi', Icon: Table },
];
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type Handle = typeof HANDLES[number];

export default function EmailDesigner({ template, onClose, onSaved }: { template: EmailTemplate | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [doc, setDoc] = useState<EmailDoc>(() => parseEmailDoc(template?.designJson) || (template ? blankEmailDoc() : EMAIL_PRESETS[0].doc));
  const [name, setName] = useState(template?.name || 'Yeni Şablon');
  const [subject, setSubject] = useState(template?.subject || 'Siparişiniz {{ order.code }} {{ order.status }}');
  const [selId, setSelId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.9);
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState<'elements' | 'tokens'>('elements');
  const [presetOpen, setPresetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);

  const scale = zoom;
  const sel = doc.elements.find((e) => e.id === selId) || null;

  const update = (id: string, patch: Partial<EmEl>) => setDoc((d) => ({ ...d, elements: d.elements.map((e) => e.id === id ? { ...e, ...patch } : e) }));
  const updateStyle = (id: string, patch: Partial<EmEl['style']>) => setDoc((d) => ({ ...d, elements: d.elements.map((e) => e.id === id ? { ...e, style: { ...e.style, ...patch } } : e) }));
  const addEl = (type: EmType) => { const el = newEmailEl(type); setDoc((d) => ({ ...d, elements: [...d.elements, el] })); setSelId(el.id); };
  const addToken = (key: string) => { const el = newEmailEl('text'); el.content = `{{${key}}}`; el.width = 220; el.height = 28; setDoc((d) => ({ ...d, elements: [...d.elements, el] })); setSelId(el.id); };
  const removeEl = (id: string) => { setDoc((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== id) })); setSelId(null); };
  const bringForward = (id: string) => setDoc((d) => { const i = d.elements.findIndex((e) => e.id === id); if (i < 0 || i === d.elements.length - 1) return d; const a = [...d.elements]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return { ...d, elements: a }; });
  const sendBackward = (id: string) => setDoc((d) => { const i = d.elements.findIndex((e) => e.id === id); if (i <= 0) return d; const a = [...d.elements]; [a[i], a[i - 1]] = [a[i - 1], a[i]]; return { ...d, elements: a }; });

  const drag = useRef<{ mode: 'move' | 'resize'; handle?: Handle; sx: number; sy: number; el: EmEl } | null>(null);
  const onElPointerDown = (e: React.PointerEvent, el: EmEl) => { if (preview) return; e.stopPropagation(); setSelId(el.id); drag.current = { mode: 'move', sx: e.clientX, sy: e.clientY, el: { ...el } }; };
  const onHandlePointerDown = (e: React.PointerEvent, el: EmEl, handle: Handle) => { e.stopPropagation(); e.preventDefault(); setSelId(el.id); drag.current = { mode: 'resize', handle, sx: e.clientX, sy: e.clientY, el: { ...el } }; };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const dr = drag.current; if (!dr) return;
      const dx = (e.clientX - dr.sx) / scale, dy = (e.clientY - dr.sy) / scale;
      const sn = (v: number) => Math.round(v);
      if (dr.mode === 'move') {
        const nx = Math.max(0, Math.min(doc.width - dr.el.width, sn(dr.el.x + dx)));
        const ny = Math.max(0, sn(dr.el.y + dy));
        update(dr.el.id, { x: nx, y: ny });
      } else {
        let { x, y, width, height } = dr.el; const h = dr.handle!;
        if (h.includes('e')) width = dr.el.width + dx;
        if (h.includes('s')) height = dr.el.height + dy;
        if (h.includes('w')) { width = dr.el.width - dx; x = dr.el.x + dx; }
        if (h.includes('n')) { height = dr.el.height - dy; y = dr.el.y + dy; }
        width = Math.max(20, sn(width)); height = Math.max(dr.el.type === 'divider' ? 1 : 16, sn(height));
        x = Math.max(0, sn(x)); y = Math.max(0, sn(y));
        update(dr.el.id, { x, y, width, height });
      }
    };
    const up = () => { drag.current = null; };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [scale, doc.width]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (preview) return;
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (!sel) { if (e.key === 'Escape') onClose(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeEl(sel.id); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); update(sel.id, { x: Math.max(0, sel.x - 1) }); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); update(sel.id, { x: Math.min(doc.width - sel.width, sel.x + 1) }); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); update(sel.id, { y: Math.max(0, sel.y - 1) }); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); update(sel.id, { y: sel.y + 1 }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, preview, doc.width]); // eslint-disable-line react-hooks/exhaustive-deps

  const onImgUpload = (file: File) => { const r = new FileReader(); r.onload = () => { if (sel) update(sel.id, { src: String(r.result) }); }; r.readAsDataURL(file); };
  const insertSubject = (scriban: string) => {
    const el = subjectRef.current; const st = el?.selectionStart ?? subject.length; const en = el?.selectionEnd ?? subject.length;
    const tok = `{{ ${scriban} }}`; const next = subject.slice(0, st) + tok + subject.slice(en); setSubject(next);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(st + tok.length, st + tok.length); });
  };

  const save = async () => {
    if (!name.trim()) return alert('Şablon adı gerekli');
    if (!subject.trim()) return alert('Konu gerekli');
    setSaving(true);
    const payload = { name: name.trim(), subject: subject.trim(), htmlBody: buildEmailHtml(doc), designJson: JSON.stringify(doc), isActive: true };
    const r = template ? await emailService.updateTemplate(template.id, payload) : await emailService.createTemplate(payload);
    if (r.ok) onSaved(template ? 'Şablon güncellendi' : 'Şablon oluşturuldu'); else { alert(r.message || 'Kaydedilemedi'); setSaving(false); }
  };

  const elInner = (el: EmEl) => {
    if (el.type === 'image') return el.src ? <img src={el.src} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">GÖRSEL</div>;
    if (el.type === 'button') return <div className="w-full h-full flex items-center justify-center rounded-lg text-center" style={{ background: el.style.bg || '#4f46e5', color: el.style.color || '#fff', borderRadius: (el.style.radius || 8) }}>{el.content || 'Buton'}</div>;
    if (el.type === 'items') return <div className="leading-tight"><div className="flex justify-between"><span>1 × Örnek Ürün</span><span>950,00 ₺</span></div><div className="text-slate-400">…ürünler</div></div>;
    if (el.type === 'divider') return null;
    return <div className="whitespace-pre-wrap break-words leading-snug">{el.content || ' '}</div>;
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-100">
      {/* Üst araç çubuğu */}
      <div className="bg-white border-b border-slate-200 min-h-14 flex flex-wrap items-center gap-2 px-3 py-2 shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Şablon adı" className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-medium w-40" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} ref={subjectRef} placeholder="Konu (e-posta başlığı)" className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm flex-1 min-w-[180px]" />
        <select value={doc.width} onChange={(e) => setDoc((d) => ({ ...d, width: parseInt(e.target.value) }))} className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-sm">
          {EMAIL_WIDTHS.map((w) => <option key={w} value={w}>{w}px</option>)}
        </select>
        <div className="relative">
          <button onClick={() => setPresetOpen((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"><LayoutTemplate className="w-4 h-4" />Hazır</button>
          {presetOpen && (<>
            <div className="fixed inset-0 z-10" onClick={() => setPresetOpen(false)} />
            <div className="absolute left-0 top-11 z-20 bg-white rounded-2xl shadow-2xl border border-slate-100 p-1.5 w-60">
              {EMAIL_PRESETS.map((p) => <button key={p.name} onClick={() => { setDoc(JSON.parse(JSON.stringify(p.doc))); setSelId(null); setPresetOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-slate-50">{p.name}</button>)}
              <button onClick={() => { setDoc(blankEmailDoc()); setSelId(null); setPresetOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-slate-50 text-slate-500">Boş tasarım</button>
            </div>
          </>)}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"><ZoomIn className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setPreview((v) => !v)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border ${preview ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>{preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}Önizle</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sol panel */}
        {!preview && (
          <div className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="flex border-b border-slate-100">
              <button onClick={() => setTab('elements')} className={`flex-1 py-2.5 text-sm font-medium ${tab === 'elements' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Elementler</button>
              <button onClick={() => setTab('tokens')} className={`flex-1 py-2.5 text-sm font-medium ${tab === 'tokens' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Değişkenler</button>
            </div>
            <div className="p-3 overflow-y-auto">
              {tab === 'elements' ? (
                <div className="grid grid-cols-2 gap-2">
                  {TOOLS.map((t) => (
                    <button key={t.type} onClick={() => addEl(t.type)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-600 text-xs">
                      <t.Icon className="w-5 h-5 text-indigo-500" />{t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-400 mb-1 flex items-center gap-1"><Database className="w-3.5 h-3.5" />Tıkla → tasarıma ekle</p>
                  {EMAIL_TOKENS.map((t) => (
                    <button key={t.key} onClick={() => addToken(t.key)} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left">
                      <span className="text-sm text-slate-700">{t.label}</span><span className="text-[10px] font-mono text-indigo-500">{`{{${t.key}}}`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center" onPointerDown={() => setSelId(null)}>
          {preview ? (
            <div className="shadow-2xl"><EmailDocRenderer doc={doc} scale={zoom} useSample /></div>
          ) : (
            <div className="relative bg-white shadow-2xl shrink-0" style={{ width: doc.width * scale, minHeight: doc.height * scale, background: doc.bg }} onPointerDown={(e) => e.stopPropagation()}>
              {doc.elements.map((el) => {
                const s = el.style || {};
                const css: React.CSSProperties = {
                  position: 'absolute', left: el.x * scale, top: el.y * scale, width: el.width * scale, height: el.height * scale,
                  fontSize: (s.fontSize || 14) * zoom, fontWeight: s.fontWeight, fontStyle: s.fontStyle, textAlign: s.align,
                  color: s.color, background: (s.bg && el.type !== 'button') ? s.bg : undefined, lineHeight: 1.3,
                  fontFamily: s.fontFamily && s.fontFamily !== 'Varsayılan' ? s.fontFamily : undefined,
                  cursor: 'move', outline: selId === el.id ? '2px solid #6366f1' : '1px dashed rgba(148,163,184,.5)',
                };
                if (el.type === 'divider') { css.borderTop = `${(s.borderWidth || 1) * zoom}px solid ${s.borderColor || '#e2e8f0'}`; css.height = Math.max(2, (s.borderWidth || 1) * zoom); css.background = undefined; }
                else if (el.type === 'box') { css.border = `${(s.borderWidth || 1) * zoom}px solid ${s.borderColor || '#cbd5e1'}`; css.borderRadius = (s.radius || 0) * zoom; if (s.align === 'center') { css.display = 'flex'; css.alignItems = 'center'; css.justifyContent = 'center'; } }
                return (
                  <div key={el.id} style={css} onPointerDown={(e) => onElPointerDown(e, el)}>
                    <div className="w-full h-full overflow-hidden pointer-events-none">{elInner(el)}</div>
                    {selId === el.id && HANDLES.map((h) => (<span key={h} onPointerDown={(e) => onHandlePointerDown(e, el, h)} className="absolute bg-white border border-indigo-500 rounded-sm" style={handlePos(h)} />))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sağ inspector */}
        {!preview && (
          <div className="w-64 bg-white border-l border-slate-200 overflow-y-auto shrink-0">
            {!sel ? (
              <div className="p-6 text-center text-slate-400 text-sm">Düzenlemek için bir eleman seçin.</div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{TOOLS.find((t) => t.type === sel.type)?.label || 'Eleman'}</span>
                  <button onClick={() => removeEl(sel.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>

                {(sel.type === 'text' || sel.type === 'heading' || sel.type === 'box' || sel.type === 'button') && (
                  <div><label className={lbl}>İçerik <span className="text-slate-400">({`{{...}}`})</span></label><textarea value={sel.content || ''} onChange={(e) => update(sel.id, { content: e.target.value })} rows={3} className={inp} /></div>
                )}
                {sel.type === 'button' && (
                  <div><label className={lbl}>Bağlantı (URL)</label><input value={sel.href || ''} onChange={(e) => update(sel.id, { href: e.target.value })} placeholder="https://…" className={inp} /></div>
                )}
                {sel.type === 'image' && (
                  <div><label className={lbl}>Görsel</label><input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImgUpload(f); }} className="text-xs" />
                    <button onClick={() => update(sel.id, { src: companyLogo() })} className="mt-1.5 text-[11px] text-indigo-600 hover:underline">Firma logosunu kullan</button></div>
                )}

                {(sel.type === 'text' || sel.type === 'heading' || sel.type === 'box' || sel.type === 'items' || sel.type === 'button') && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={lbl}>Font (px)</label><input type="number" value={sel.style.fontSize || 14} onChange={(e) => updateStyle(sel.id, { fontSize: Number(e.target.value) })} className={inp} /></div>
                      <div><label className={lbl}>Hizalama</label><select value={sel.style.align || 'left'} onChange={(e) => updateStyle(sel.id, { align: e.target.value as 'left' | 'center' | 'right' })} className={inp}><option value="left">Sol</option><option value="center">Orta</option><option value="right">Sağ</option></select></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateStyle(sel.id, { fontWeight: sel.style.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`flex-1 py-1.5 rounded-xl text-sm font-bold border ${sel.style.fontWeight === 'bold' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200'}`}>B</button>
                      <button onClick={() => updateStyle(sel.id, { fontStyle: sel.style.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`flex-1 py-1.5 rounded-xl text-sm italic border ${sel.style.fontStyle === 'italic' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200'}`}>I</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={lbl}>Metin Rengi</label><input type="color" value={sel.style.color || '#334155'} onChange={(e) => updateStyle(sel.id, { color: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200" /></div>
                      <div><label className={lbl}>Arka Plan</label><input type="color" value={sel.style.bg || '#ffffff'} onChange={(e) => updateStyle(sel.id, { bg: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200" /></div>
                    </div>
                  </>
                )}
                {(sel.type === 'divider' || sel.type === 'box') && (
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={lbl}>Çizgi (px)</label><input type="number" value={sel.style.borderWidth || 1} onChange={(e) => updateStyle(sel.id, { borderWidth: Number(e.target.value) })} className={inp} /></div>
                    <div><label className={lbl}>Çizgi Rengi</label><input type="color" value={sel.style.borderColor || '#e2e8f0'} onChange={(e) => updateStyle(sel.id, { borderColor: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200" /></div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <label className={lbl}>Konum / Boyut (px)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <NumF label="X" v={sel.x} on={(v) => update(sel.id, { x: v })} />
                    <NumF label="Y" v={sel.y} on={(v) => update(sel.id, { y: v })} />
                    <NumF label="G" v={sel.width} on={(v) => update(sel.id, { width: v })} />
                    <NumF label="Y↕" v={sel.height} on={(v) => update(sel.id, { height: v })} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => bringForward(sel.id)} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-xl border border-slate-200 text-xs hover:bg-slate-50"><ChevronUp className="w-4 h-4" />Öne</button>
                  <button onClick={() => sendBackward(sel.id)} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-xl border border-slate-200 text-xs hover:bg-slate-50"><ChevronDown className="w-4 h-4" />Arkaya</button>
                </div>
              </div>
            )}
            {/* Konu değişkenleri */}
            <div className="px-4 pb-4 border-t border-slate-100 pt-3">
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">Konuya değişken ekle</div>
              <div className="flex flex-wrap gap-1">
                {EMAIL_TOKENS.map((t) => <button key={t.key} onClick={() => insertSubject(t.scriban)} className="text-[10px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-full">{t.label}</button>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = 'text-[11px] font-medium text-slate-500';
const inp = 'w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

function NumF({ label, v, on }: { label: string; v: number; on: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-slate-400 w-5">{label}</span>
      <input type="number" value={Math.round(v)} onChange={(e) => on(Number(e.target.value))} className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
    </div>
  );
}

function handlePos(h: Handle): React.CSSProperties {
  const sz = 9; const o = -sz / 2; const c: React.CSSProperties = { width: sz, height: sz, cursor: cursorFor(h) };
  if (h.includes('n')) c.top = o; if (h.includes('s')) c.bottom = o;
  if (h.includes('w')) c.left = o; if (h.includes('e')) c.right = o;
  if (h === 'n' || h === 's') { c.left = '50%'; c.marginLeft = o; }
  if (h === 'e' || h === 'w') { c.top = '50%'; c.marginTop = o; }
  return c;
}
function cursorFor(h: Handle): string {
  return ({ n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' } as Record<Handle, string>)[h];
}
