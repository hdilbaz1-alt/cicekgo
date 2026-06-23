// E-posta şablonu — yazdırma tasarımcısıyla aynı serbest yerleşim mantığı, ama px tabanlı ve e-posta HTML'i üretir.
// Tasarımcıda kolay {{key}} token'ları kullanılır; HTML'e çevirirken backend'in Scriban modeline ({{ order.code }}) map edilir.
import React from 'react';

export type EmType = 'text' | 'heading' | 'button' | 'image' | 'divider' | 'box' | 'items';

export interface EmStyle {
  fontSize?: number; fontWeight?: 'normal' | 'bold'; fontStyle?: 'normal' | 'italic';
  align?: 'left' | 'center' | 'right'; color?: string; bg?: string; fontFamily?: string;
  borderWidth?: number; borderColor?: string; radius?: number; lineHeight?: number;
}
export interface EmEl {
  id: string; type: EmType;
  x: number; y: number; width: number; height: number; // px
  content?: string; href?: string; src?: string; style: EmStyle;
}
export interface EmailDoc { version: 1; width: number; height: number; bg: string; elements: EmEl[] }

export const EMAIL_WIDTHS = [600, 520, 480];

export interface EmToken { key: string; label: string; scriban: string; sample: string }
export const EMAIL_TOKENS: EmToken[] = [
  { key: 'companyName', label: 'Firma Adı', scriban: 'company.name', sample: 'ÇiçekGo' },
  { key: 'recipientName', label: 'Alıcı Adı', scriban: 'recipient.name', sample: 'Ayşe Yılmaz' },
  { key: 'recipientPhone', label: 'Alıcı Telefon', scriban: 'recipient.phone', sample: '0555 111 22 33' },
  { key: 'senderName', label: 'Gönderici Adı', scriban: 'sender.name', sample: 'Mehmet Demir' },
  { key: 'senderPhone', label: 'Gönderici Telefon', scriban: 'sender.phone', sample: '0555 444 55 66' },
  { key: 'orderCode', label: 'Sipariş Kodu', scriban: 'order.code', sample: 'SIP-2026-0042' },
  { key: 'orderStatus', label: 'Sipariş Durumu', scriban: 'order.status', sample: 'Kargoya Verildi' },
  { key: 'orderTotal', label: 'Toplam Tutar', scriban: 'order.total', sample: '1.250,00 ₺' },
  { key: 'deliveryDate', label: 'Teslimat Tarihi', scriban: 'order.delivery_date', sample: '23.06.2026 14:30' },
  { key: 'cardNote', label: 'Kart Notu', scriban: 'order.note', sample: 'Doğum günün kutlu olsun!' },
];
const TOKEN_MAP = new Map(EMAIL_TOKENS.map((t) => [t.key, t]));

const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** {{key}} → örnek değer (tasarımcı/önizleme için). */
export function applySample(content: string): string {
  return (content || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => TOKEN_MAP.get(k)?.sample ?? m);
}
/** {{key}} → Scriban ifadesi ({{ order.code }}) (gönderim HTML'i için). */
export function toScriban(content: string): string {
  return (content || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => { const t = TOKEN_MAP.get(k); return t ? `{{ ${t.scriban} }}` : m; });
}

export function companyLogo(): string {
  try { return JSON.parse(localStorage.getItem('tenantInfo') || '{}').logoBase64 || ''; } catch { return ''; }
}

let _idc = 0;
export function newEmailId() { _idc += 1; return `em_${Date.now().toString(36)}_${_idc}`; }

export function newEmailEl(type: EmType): EmEl {
  const base: EmEl = { id: newEmailId(), type, x: 40, y: 40, width: 300, height: 40, content: '', style: { fontSize: 14, color: '#334155', align: 'left' } };
  switch (type) {
    case 'heading': return { ...base, content: 'Başlık', height: 36, width: 420, style: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', align: 'left' } };
    case 'text': return { ...base, content: 'Metin {{recipientName}}', width: 420, height: 48, style: { fontSize: 14, color: '#334155', align: 'left', lineHeight: 1.5 } };
    case 'button': return { ...base, content: 'Butona Tıkla', href: '#', width: 180, height: 44, style: { fontSize: 14, fontWeight: 'bold', color: '#ffffff', bg: '#4f46e5', align: 'center', radius: 8 } };
    case 'image': return { ...base, width: 160, height: 60, src: companyLogo(), style: {} };
    case 'divider': return { ...base, width: 420, height: 1, style: { borderWidth: 1, borderColor: '#e2e8f0' } };
    case 'box': return { ...base, width: 420, height: 90, content: '{{cardNote}}', style: { fontSize: 14, color: '#7c2d12', bg: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', radius: 10, align: 'center' } };
    case 'items': return { ...base, width: 420, height: 120, style: { fontSize: 14, color: '#334155' } };
    default: return base;
  }
}

function innerHtml(el: EmEl, useSample: boolean): string {
  const conv = (s: string) => (useSample ? applySample(s) : toScriban(s));
  if (el.type === 'image') {
    const src = el.src || companyLogo();
    return src ? `<img src="${src}" style="max-width:100%;max-height:100%;object-fit:contain" />` : `<div style="width:100%;height:100%;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px">GÖRSEL</div>`;
  }
  if (el.type === 'button') {
    const s = el.style;
    return `<a href="${useSample ? '#' : conv(el.href || '#')}" style="display:inline-block;width:100%;height:100%;box-sizing:border-box;line-height:${el.height - 0}px;text-align:center;text-decoration:none;color:${s.color || '#fff'};background:${s.bg || '#4f46e5'};border-radius:${s.radius || 8}px;font-weight:${s.fontWeight || 'bold'};font-size:${s.fontSize || 14}px">${esc(conv(el.content || ''))}</a>`;
  }
  if (el.type === 'items') {
    if (useSample) {
      return `<div style="display:flex;justify-content:space-between;padding:3px 0"><span>1 × Kırmızı Gül Buketi</span><span>950,00 ₺</span></div><div style="display:flex;justify-content:space-between;padding:3px 0"><span>2 × Çikolata</span><span>300,00 ₺</span></div>`;
    }
    return `{{ for item in order.items }}<div style="display:flex;justify-content:space-between;padding:3px 0"><span>{{ item.qty }} × {{ item.name }}</span><span>{{ item.total }}</span></div>{{ end }}`;
  }
  if (el.type === 'divider') return '';
  // text / heading / box
  return esc(conv(el.content || '')).replace(/\n/g, '<br/>');
}

function elStyleCss(el: EmEl): string {
  const s = el.style || {};
  const css: string[] = [
    'position:absolute', `left:${el.x}px`, `top:${el.y}px`, `width:${el.width}px`, `height:${el.height}px`,
    `font-size:${s.fontSize || 14}px`, `font-weight:${s.fontWeight || 'normal'}`, `font-style:${s.fontStyle || 'normal'}`,
    `text-align:${s.align || 'left'}`, `color:${s.color || '#334155'}`, 'overflow:hidden', `line-height:${s.lineHeight || 1.4}`,
  ];
  if (s.fontFamily && s.fontFamily !== 'Varsayılan') css.push(`font-family:${s.fontFamily}`);
  if (s.bg && el.type !== 'button') css.push(`background:${s.bg}`);
  if (el.type === 'divider') { css.push(`border-top:${s.borderWidth || 1}px solid ${s.borderColor || '#e2e8f0'}`, 'height:0'); }
  else if (el.type === 'box') { css.push(`border:${s.borderWidth || 1}px solid ${s.borderColor || '#cbd5e1'}`, `border-radius:${s.radius || 0}px`, 'padding:8px', 'box-sizing:border-box'); if (s.align === 'center') css.push('display:flex', 'align-items:center', 'justify-content:center'); }
  return css.join(';');
}

/** Gönderilecek e-posta HTML'i (Scriban token'larıyla). */
export function buildEmailHtml(doc: EmailDoc): string {
  const els = doc.elements.map((el) => `<div style="${elStyleCss(el)}">${innerHtml(el, false)}</div>`).join('\n');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0"><tr><td align="center">
<div style="position:relative;width:${doc.width}px;min-height:${doc.height}px;background:${doc.bg || '#ffffff'};font-family:Arial,Helvetica,sans-serif;border-radius:12px;overflow:hidden">
${els}
</div></td></tr></table>`;
}

/** Ekran/önizleme render'ı (mutlak konumlu, px*zoom). */
export function EmailDocRenderer({ doc, scale = 1, useSample = false }: { doc: EmailDoc; scale?: number; useSample?: boolean }) {
  return (
    <div className="relative" style={{ width: doc.width * scale, minHeight: doc.height * scale, background: doc.bg || '#ffffff' }}>
      {doc.elements.map((el) => {
        const s = el.style || {};
        const css: React.CSSProperties = {
          position: 'absolute', left: el.x * scale, top: el.y * scale, width: el.width * scale, height: el.height * scale,
          fontSize: (s.fontSize || 14) * scale, fontWeight: s.fontWeight, fontStyle: s.fontStyle, textAlign: s.align,
          color: s.color, overflow: 'hidden', lineHeight: s.lineHeight ? String(s.lineHeight) : '1.4',
          fontFamily: s.fontFamily && s.fontFamily !== 'Varsayılan' ? s.fontFamily : undefined,
        };
        if (s.bg && el.type !== 'button') css.background = s.bg;
        if (el.type === 'divider') { css.borderTop = `${(s.borderWidth || 1) * scale}px solid ${s.borderColor || '#e2e8f0'}`; css.height = 0; }
        else if (el.type === 'box') { css.border = `${(s.borderWidth || 1) * scale}px solid ${s.borderColor || '#cbd5e1'}`; css.borderRadius = (s.radius || 0) * scale; css.padding = 8 * scale; if (s.align === 'center') { css.display = 'flex'; css.alignItems = 'center'; css.justifyContent = 'center'; } }
        return <div key={el.id} style={css} dangerouslySetInnerHTML={{ __html: innerHtml(el, useSample) }} />;
      })}
    </div>
  );
}

export function blankEmailDoc(): EmailDoc {
  return { version: 1, width: 600, height: 520, bg: '#ffffff', elements: [] };
}

export const EMAIL_PRESETS: { name: string; doc: EmailDoc }[] = [
  {
    name: 'Sipariş Durum Bildirimi',
    doc: {
      version: 1, width: 600, height: 520, bg: '#ffffff', elements: [
        { id: 'e1', type: 'box', x: 0, y: 0, width: 600, height: 64, content: '{{companyName}}', style: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', bg: '#4f46e5', align: 'center', borderWidth: 0, borderColor: '#4f46e5', radius: 0 } },
        { id: 'e2', type: 'heading', x: 40, y: 96, width: 520, height: 34, content: 'Merhaba {{recipientName}},', style: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', align: 'left' } },
        { id: 'e3', type: 'text', x: 40, y: 140, width: 520, height: 60, content: 'Siparişiniz {{orderCode}} için durum: {{orderStatus}}.\nToplam Tutar: {{orderTotal}}', style: { fontSize: 15, color: '#334155', align: 'left', lineHeight: 1.6 } },
        { id: 'e4', type: 'items', x: 40, y: 210, width: 520, height: 90, style: { fontSize: 14, color: '#334155' } },
        { id: 'e5', type: 'divider', x: 40, y: 320, width: 520, height: 1, style: { borderWidth: 1, borderColor: '#e2e8f0' } },
        { id: 'e6', type: 'box', x: 40, y: 340, width: 520, height: 80, content: '{{cardNote}}', style: { fontSize: 16, color: '#7c2d12', bg: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', radius: 10, align: 'center' } },
        { id: 'e7', type: 'text', x: 40, y: 440, width: 520, height: 30, content: '{{companyName}} · Bu e-posta siparişinizle ilgili gönderilmiştir.', style: { fontSize: 12, color: '#94a3b8', align: 'center' } },
      ],
    },
  },
];

export function parseEmailDoc(json?: string | null): EmailDoc | null {
  if (!json) return null;
  try { const d = JSON.parse(json); if (d && Array.isArray(d.elements) && typeof d.width === 'number') return d as EmailDoc; } catch { /* */ }
  return null;
}
