// Dinamik yazdırma şablonu — serbest yerleşim (Canva benzeri) belge modeli, token çözümleme ve render.
// Birim: mm. Ekran render'ı px = mm * PXMM (96dpi); zoom CSS transform ile uygulanır. Baskı doğrudan mm kullanır.
import React from 'react';

export const PXMM = 3.7795275591; // 1mm @ 96dpi
export const PAPER: Record<'A4' | 'A5', { w: number; h: number }> = { A4: { w: 210, h: 297 }, A5: { w: 148, h: 210 } };

export type ElType = 'text' | 'heading' | 'line' | 'box' | 'image' | 'qr' | 'items';

export interface ElStyle {
  fontSize?: number; fontWeight?: 'normal' | 'bold'; fontStyle?: 'normal' | 'italic';
  align?: 'left' | 'center' | 'right'; color?: string; bg?: string; fontFamily?: string;
  borderWidth?: number; borderColor?: string; radius?: number; lineHeight?: number;
}
export interface El {
  id: string; type: ElType;
  x: number; y: number; width: number; height: number; // mm
  content?: string; src?: string; style: ElStyle;
}
export interface TemplateDoc { version: 1; paper: 'A4' | 'A5'; orientation: 'portrait' | 'landscape'; elements: El[] }

export interface PreviewData {
  orderCode?: string; createdDate?: string | null; deliveryDate?: string | null; deliveryTimeRange?: string | null;
  productType?: string | null; items?: { quantity: number; productName: string; unitPrice?: number; totalPrice?: number }[];
  extraNote?: string | null; orderAmount?: number; paymentStatus?: string | null;
  recipientName?: string | null; recipientPhone?: string | null; recipientAddress?: string | null;
  senderName?: string | null; senderPhone?: string | null; cardNote?: string | null;
}

export const SAMPLE: PreviewData = {
  orderCode: 'SIP2026000123', createdDate: new Date().toISOString(), deliveryDate: new Date().toISOString(),
  deliveryTimeRange: '14:00 - 16:00', productType: 'Aranjman',
  items: [{ quantity: 1, productName: 'Orta Boy Aranjman', unitPrice: 850, totalPrice: 850 }],
  extraNote: 'Teslimden önce arayınız', orderAmount: 850, paymentStatus: 'Ödendi',
  recipientName: 'Ayşe Yılmaz', recipientPhone: '05551234567', recipientAddress: 'Çankaya / Ankara',
  senderName: 'Mehmet Demir', senderPhone: '05531234567', cardNote: 'Doğum günün kutlu olsun 🌹',
};

export const money = (n?: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' }) : '';
const fmtDateTime = (s?: string | null) => s ? new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export function companyName(): string {
  try { return JSON.parse(localStorage.getItem('tenantInfo') || '{}').name || 'ÇiçekGo'; } catch { return 'ÇiçekGo'; }
}
export function companyLogo(): string {
  try { return JSON.parse(localStorage.getItem('tenantInfo') || '{}').logoBase64 || ''; } catch { return ''; }
}

export interface TokenDef { key: string; label: string; sample: string; resolve: (d: PreviewData) => string }
export const TOKENS: TokenDef[] = [
  { key: 'orderCode', label: 'Sipariş Kodu', sample: SAMPLE.orderCode!, resolve: (d) => d.orderCode || '' },
  { key: 'recipientName', label: 'Alıcı Adı', sample: SAMPLE.recipientName!, resolve: (d) => d.recipientName || '' },
  { key: 'recipientPhone', label: 'Alıcı Telefon', sample: SAMPLE.recipientPhone!, resolve: (d) => d.recipientPhone || '' },
  { key: 'recipientAddress', label: 'Alıcı Adres', sample: SAMPLE.recipientAddress!, resolve: (d) => d.recipientAddress || '' },
  { key: 'senderName', label: 'Gönderici Adı', sample: SAMPLE.senderName!, resolve: (d) => d.senderName || '' },
  { key: 'senderPhone', label: 'Gönderici Telefon', sample: SAMPLE.senderPhone!, resolve: (d) => d.senderPhone || '' },
  { key: 'deliveryDate', label: 'Teslim Tarihi', sample: fmtDate(SAMPLE.deliveryDate), resolve: (d) => fmtDate(d.deliveryDate) },
  { key: 'deliveryTimeRange', label: 'Teslim Saati', sample: SAMPLE.deliveryTimeRange!, resolve: (d) => d.deliveryTimeRange || '' },
  { key: 'createdDate', label: 'Oluşturulma', sample: fmtDateTime(SAMPLE.createdDate), resolve: (d) => fmtDateTime(d.createdDate) },
  { key: 'productType', label: 'Ürün Türü', sample: SAMPLE.productType!, resolve: (d) => d.productType || '' },
  { key: 'orderAmount', label: 'Tutar', sample: money(SAMPLE.orderAmount), resolve: (d) => money(d.orderAmount) },
  { key: 'paymentStatus', label: 'Ödeme Durumu', sample: SAMPLE.paymentStatus!, resolve: (d) => d.paymentStatus || '' },
  { key: 'extraNote', label: 'Ekstra Not', sample: SAMPLE.extraNote!, resolve: (d) => d.extraNote || '' },
  { key: 'cardNote', label: 'Kart Notu', sample: SAMPLE.cardNote!, resolve: (d) => d.cardNote || '' },
  { key: 'companyName', label: 'Firma Adı', sample: companyName(), resolve: () => companyName() },
];
const TOKEN_MAP = new Map(TOKENS.map((t) => [t.key, t]));

export function applyTokens(content: string, data: PreviewData, useSample = false): string {
  return (content || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => {
    const t = TOKEN_MAP.get(key);
    if (!t) return m;
    return useSample ? t.sample : t.resolve(data);
  });
}

export function pageDims(doc: TemplateDoc) {
  const p = PAPER[doc.paper] || PAPER.A4;
  return doc.orientation === 'landscape' ? { w: p.h, h: p.w } : { w: p.w, h: p.h };
}

let _idc = 0;
export function newId() { _idc += 1; return `el_${Date.now().toString(36)}_${_idc}`; }

export function newElement(type: ElType): El {
  const base: El = { id: newId(), type, x: 15, y: 15, width: 60, height: 12, content: '', style: { fontSize: 12, color: '#111827', align: 'left' } };
  switch (type) {
    case 'heading': return { ...base, content: 'Başlık', height: 14, style: { fontSize: 22, fontWeight: 'bold', color: '#111827', align: 'left' } };
    case 'text': return { ...base, content: 'Metin', style: { fontSize: 12, color: '#374151', align: 'left' } };
    case 'line': return { ...base, height: 1, width: 100, style: { borderWidth: 1, borderColor: '#9ca3af' } };
    case 'box': return { ...base, width: 60, height: 40, style: { borderWidth: 1, borderColor: '#cbd5e1', bg: '', radius: 2 } };
    case 'image': return { ...base, width: 40, height: 20, src: companyLogo(), style: {} };
    case 'qr': return { ...base, width: 25, height: 25, style: {} };
    case 'items': return { ...base, width: 120, height: 40, style: { fontSize: 11, color: '#374151' } };
    default: return base;
  }
}

const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Tek bir elemanın iç içeriğini düz metin/HTML olarak verir (mode: 'react' | 'html'). */
function renderContent(el: El, data: PreviewData, qr: string, useSample: boolean): { html: string } {
  if (el.type === 'qr') {
    return { html: qr ? `<img src="${qr}" style="width:100%;height:100%;object-fit:contain" />` : `<div style="width:100%;height:100%;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px">QR</div>` };
  }
  if (el.type === 'image') {
    const src = el.src || companyLogo();
    return { html: src ? `<img src="${src}" style="width:100%;height:100%;object-fit:contain" />` : `<div style="width:100%;height:100%;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px">LOGO</div>` };
  }
  if (el.type === 'items') {
    const rows = (data.items || []).map((it) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:2px 0"><span>${esc(String(it.quantity))} × ${esc(it.productName)}</span><span>${esc(money(it.totalPrice ?? (it.unitPrice || 0) * it.quantity))}</span></div>`).join('');
    return { html: rows || '<div style="color:#94a3b8">Ürün yok</div>' };
  }
  if (el.type === 'line') return { html: '' };
  if (el.type === 'box') return { html: el.content ? esc(applyTokens(el.content, data, useSample)).replace(/\n/g, '<br/>') : '' };
  // text / heading
  return { html: esc(applyTokens(el.content || '', data, useSample)).replace(/\n/g, '<br/>') };
}

function boxStyle(el: El, scale: number): React.CSSProperties {
  const s = el.style || {};
  const css: React.CSSProperties = {
    position: 'absolute', left: el.x * scale, top: el.y * scale, width: el.width * scale, height: el.height * scale,
    fontSize: (s.fontSize || 12) * (scale / PXMM), fontWeight: s.fontWeight || 'normal', fontStyle: s.fontStyle || 'normal',
    textAlign: s.align || 'left', color: s.color || '#111827', overflow: 'hidden', lineHeight: s.lineHeight ? String(s.lineHeight) : '1.25',
    fontFamily: s.fontFamily && s.fontFamily !== 'Varsayılan' ? s.fontFamily : undefined,
  };
  if (s.bg) css.background = s.bg;
  if (el.type === 'line') { css.borderTop = `${(s.borderWidth || 1)}px solid ${s.borderColor || '#9ca3af'}`; css.height = 0; }
  else if (el.type === 'box') { css.border = `${(s.borderWidth || 1)}px solid ${s.borderColor || '#cbd5e1'}`; css.borderRadius = (s.radius || 0) * scale; }
  if (el.type === 'box' && (s.align === 'center')) { css.display = 'flex'; css.alignItems = 'center'; css.justifyContent = 'center'; }
  return css;
}

/** Ekran/önizleme render'ı (mutlak konumlu). scale = px/mm. */
export function DocRenderer({ doc, data, qr = '', scale = PXMM, useSample = false, className = '' }: {
  doc: TemplateDoc; data: PreviewData; qr?: string; scale?: number; useSample?: boolean; className?: string;
}) {
  const dim = pageDims(doc);
  return (
    <div className={`relative bg-white ${className}`} style={{ width: dim.w * scale, height: dim.h * scale }}>
      {doc.elements.map((el) => {
        const { html } = renderContent(el, data, qr, useSample);
        return <div key={el.id} style={boxStyle(el, scale)} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}

/** window.print için tam HTML (mm-hassas). */
export function buildDocPrintHtml(doc: TemplateDoc, data: PreviewData, qr: string): string {
  const dim = pageDims(doc);
  const els = doc.elements.map((el) => {
    const s = el.style || {};
    const styles: string[] = [
      'position:absolute', `left:${el.x}mm`, `top:${el.y}mm`, `width:${el.width}mm`, `height:${el.height}mm`,
      `font-size:${s.fontSize || 12}px`, `font-weight:${s.fontWeight || 'normal'}`, `font-style:${s.fontStyle || 'normal'}`,
      `text-align:${s.align || 'left'}`, `color:${s.color || '#111827'}`, 'overflow:hidden', `line-height:${s.lineHeight || 1.25}`,
    ];
    if (s.fontFamily && s.fontFamily !== 'Varsayılan') styles.push(`font-family:${s.fontFamily}`);
    if (s.bg) styles.push(`background:${s.bg}`);
    if (el.type === 'line') { styles.push(`border-top:${s.borderWidth || 1}px solid ${s.borderColor || '#9ca3af'}`, 'height:0'); }
    else if (el.type === 'box') { styles.push(`border:${s.borderWidth || 1}px solid ${s.borderColor || '#cbd5e1'}`, `border-radius:${s.radius || 0}mm`); if (s.align === 'center') styles.push('display:flex', 'align-items:center', 'justify-content:center'); }
    const { html } = renderContent(el, data, qr, false);
    return `<div style="${styles.join(';')}">${html}</div>`;
  }).join('\n');

  const landscape = doc.orientation === 'landscape' ? ' landscape' : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  @page { size: ${doc.paper}${landscape}; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { font-family: 'Inter', Arial, sans-serif; }
  .page { position:relative; width:${dim.w}mm; height:${dim.h}mm; overflow:hidden; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body><div class="page">${els}</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close()},300)}</script>
</body></html>`;
}

// ---- Hazır şablonlar (presetler) ----
export const PRESETS: { name: string; doc: TemplateDoc }[] = [
  {
    name: 'Klasik Fatura (A4)',
    doc: {
      version: 1, paper: 'A4', orientation: 'portrait', elements: [
        { id: 'p1', type: 'image', x: 15, y: 12, width: 45, height: 22, src: '', style: {} },
        { id: 'p2', type: 'heading', x: 120, y: 14, width: 75, height: 10, content: 'SİPARİŞ', style: { fontSize: 24, fontWeight: 'bold', align: 'right', color: '#111827' } },
        { id: 'p3', type: 'text', x: 120, y: 26, width: 75, height: 6, content: 'No: {{orderCode}}', style: { fontSize: 12, align: 'right', color: '#374151' } },
        { id: 'p4', type: 'text', x: 120, y: 32, width: 75, height: 6, content: 'Tarih: {{deliveryDate}}', style: { fontSize: 11, align: 'right', color: '#6b7280' } },
        { id: 'p5', type: 'line', x: 15, y: 42, width: 180, height: 1, content: '', style: { borderWidth: 1, borderColor: '#e5e7eb' } },
        { id: 'p6', type: 'text', x: 15, y: 48, width: 90, height: 24, content: 'Alıcı: {{recipientName}}\n{{recipientPhone}}\n{{recipientAddress}}', style: { fontSize: 12, color: '#111827' } },
        { id: 'p7', type: 'text', x: 110, y: 48, width: 85, height: 18, content: 'Gönderici: {{senderName}}\n{{senderPhone}}', style: { fontSize: 12, color: '#111827' } },
        { id: 'p8', type: 'text', x: 15, y: 78, width: 60, height: 6, content: 'Ürünler', style: { fontSize: 13, fontWeight: 'bold', color: '#111827' } },
        { id: 'p9', type: 'items', x: 15, y: 86, width: 180, height: 40, content: '', style: { fontSize: 12, color: '#374151' } },
        { id: 'p10', type: 'line', x: 15, y: 130, width: 180, height: 1, content: '', style: { borderWidth: 1, borderColor: '#e5e7eb' } },
        { id: 'p11', type: 'text', x: 120, y: 134, width: 75, height: 8, content: 'Genel Toplam: {{orderAmount}}', style: { fontSize: 14, fontWeight: 'bold', align: 'right', color: '#111827' } },
        { id: 'p12', type: 'box', x: 15, y: 150, width: 120, height: 40, content: '{{cardNote}}', style: { fontSize: 16, color: '#7c2d12', borderWidth: 1, borderColor: '#fcd34d', bg: '#fffbeb', radius: 2, align: 'center' } },
        { id: 'p13', type: 'qr', x: 165, y: 150, width: 30, height: 30, content: '', style: {} },
      ],
    },
  },
  {
    name: 'Hızlı Makbuz (A5)',
    doc: {
      version: 1, paper: 'A5', orientation: 'portrait', elements: [
        { id: 'm1', type: 'heading', x: 12, y: 10, width: 124, height: 9, content: '{{companyName}}', style: { fontSize: 18, fontWeight: 'bold', align: 'center', color: '#111827' } },
        { id: 'm2', type: 'text', x: 12, y: 22, width: 124, height: 6, content: 'Sipariş: {{orderCode}} · {{deliveryDate}}', style: { fontSize: 11, align: 'center', color: '#6b7280' } },
        { id: 'm3', type: 'line', x: 12, y: 30, width: 124, height: 1, content: '', style: { borderWidth: 1, borderColor: '#e5e7eb' } },
        { id: 'm4', type: 'text', x: 12, y: 35, width: 124, height: 16, content: 'Alıcı: {{recipientName}} · {{recipientPhone}}\n{{recipientAddress}}', style: { fontSize: 11, color: '#111827' } },
        { id: 'm5', type: 'items', x: 12, y: 54, width: 124, height: 30, content: '', style: { fontSize: 11, color: '#374151' } },
        { id: 'm6', type: 'text', x: 12, y: 88, width: 124, height: 7, content: 'Toplam: {{orderAmount}}', style: { fontSize: 13, fontWeight: 'bold', align: 'right', color: '#111827' } },
        { id: 'm7', type: 'box', x: 12, y: 100, width: 90, height: 30, content: '{{cardNote}}', style: { fontSize: 14, color: '#7c2d12', borderWidth: 1, borderColor: '#fcd34d', bg: '#fffbeb', radius: 2, align: 'center' } },
        { id: 'm8', type: 'qr', x: 110, y: 100, width: 26, height: 26, content: '', style: {} },
      ],
    },
  },
];

export function blankDoc(paper: 'A4' | 'A5' = 'A4'): TemplateDoc { return { version: 1, paper, orientation: 'portrait', elements: [] }; }

export function parseDoc(elementsJson?: string | null): TemplateDoc | null {
  if (!elementsJson) return null;
  try { const d = JSON.parse(elementsJson); if (d && Array.isArray(d.elements)) return d as TemplateDoc; } catch { /* */ }
  return null;
}
