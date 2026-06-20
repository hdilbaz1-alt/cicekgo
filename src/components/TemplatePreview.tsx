'use client';

import { PrintTemplate, PrintTemplateSave } from '@/services/templateService';

type Tpl = PrintTemplate | PrintTemplateSave;

export interface PreviewData {
  orderCode?: string;
  createdDate?: string | null;
  deliveryDate?: string | null;
  deliveryTimeRange?: string | null;
  productType?: string | null;
  items?: { quantity: number; productName: string }[];
  extraNote?: string | null;
  orderAmount?: number;
  paymentStatus?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientAddress?: string | null;
  senderName?: string | null;
  senderPhone?: string | null;
  cardNote?: string | null;
}

const money = (n?: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' }) : '-';
const fmtDateTime = (s?: string | null) => s ? new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export function noteFontFamily(style: string, font: string) {
  if (style === 'Script') return "'Segoe Script','Brush Script MT',cursive";
  if (font && font !== 'Varsayılan') return font;
  return 'inherit';
}

function getLogo() {
  try { const ti = JSON.parse(localStorage.getItem('tenantInfo') || '{}'); return { src: ti.logoBase64 || '', removeBg: !!ti.logoRemoveBg, name: ti.name || 'ÇiçekGo' }; }
  catch { return { src: '', removeBg: false, name: 'ÇiçekGo' }; }
}

export default function TemplatePreview({ tpl, data, qr, noteSize, id }: { tpl: Tpl; data: PreviewData; qr?: string; noteSize?: number; id?: string }) {
  const logo = getLogo();
  const size = noteSize ?? tpl.noteFontSize ?? 18;
  const productLine = (data.items && data.items.length > 0)
    ? data.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ')
    : (data.productType || '');
  const cardNoteText = (tpl.noteContent || '{{kart_notu}}').replace('{{kart_notu}}', data.cardNote || '');

  return (
    <div id={id} className="bg-white rounded-lg p-6 w-full" style={{ maxWidth: tpl.paperType === 'A4' ? 760 : 560 }}>
      <div className="flex justify-center mb-4">
        {logo.src
          ? <img src={logo.src} alt={logo.name} className="h-14 w-auto max-w-[220px] object-contain" style={logo.removeBg ? { mixBlendMode: 'multiply' } : undefined} />
          : <span className="text-2xl font-bold text-slate-800">{logo.name}</span>}
      </div>

      <Section title="Sipariş Bilgileri">
        <div className="flex gap-4">
          <div className="flex-1 space-y-1.5 text-[13px]">
            <Row label="Teslim Zamanı" value={`${fmtDate(data.deliveryDate)}${data.deliveryTimeRange ? ` · ${data.deliveryTimeRange}` : ''}`} valueCls="text-blue-700" />
            {tpl.showOrderCode && <Row label="Kod/K. Tarihi" value={`${data.orderCode || ''}${tpl.showCreatedDate && data.createdDate ? ` (${fmtDateTime(data.createdDate)})` : ''}`} valueCls="text-blue-700" />}
            <Row label="Çiçek Türü" value={data.items?.[0]?.productName || data.productType || '-'} valueCls="text-blue-700" />
            {productLine && <div className="text-red-600 font-medium pt-1">{productLine}</div>}
            {tpl.showExtraNote && <Row label="Ekstra Not" value={data.extraNote || ''} />}
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            {tpl.showQr && qr && <img src={qr} alt="QR" className="w-24 h-24" />}
            {tpl.showPrice && <div className="text-slate-700 font-semibold">{money(data.orderAmount)}</div>}
            {tpl.showPaymentStatus && data.paymentStatus && <div className="text-xs text-slate-500">{data.paymentStatus}</div>}
          </div>
        </div>
      </Section>

      <Section title="Alıcı Bilgileri">
        <div className="text-[13px] space-y-1">
          <div><b className="text-slate-700">Ad Soyad:</b> <span className="text-blue-700">{data.recipientName || '-'}</span>{tpl.showRecipientPhone && <span className="float-right"><b className="text-slate-700">Tel:</b> {data.recipientPhone || '-'}</span>}</div>
          <div><b className="text-slate-700">Adres:</b> {data.recipientAddress || '-'}</div>
        </div>
      </Section>

      <Section title="Gönderici Bilgileri">
        <div className="text-[13px]"><b className="text-slate-700">Ad Soyad:</b> <span className="text-blue-700">{data.senderName || '-'}</span>{tpl.showSenderPhone && <span className="float-right"><b className="text-slate-700">Tel:</b> {data.senderPhone || '-'}</span>}</div>
      </Section>

      <Section title="Kart Notu - Şerit">
        <div className="min-h-[110px] flex items-center justify-center text-center px-3 py-4"
          style={{ fontSize: size, color: tpl.noteColor || '#333', fontWeight: tpl.noteBold ? 700 : 400, fontStyle: tpl.noteFontStyle === 'Italic' ? 'italic' : 'normal', fontFamily: noteFontFamily(tpl.noteFontStyle || 'Normal', tpl.noteFont || 'Varsayılan') }}>
          {cardNoteText || <span className="text-slate-300 text-sm" style={{ fontFamily: 'inherit' }}>—</span>}
        </div>
      </Section>

      <Section title="Teslim Alan">
        <div className="text-[13px] flex justify-between pt-1"><span><b className="text-slate-700">Ad Soyad:</b> ____________</span><span><b className="text-slate-700">İmza:</b> ____________</span></div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-red-300 rounded-lg px-3 pb-3 pt-1 mb-3">
      <legend className="px-2 text-sm font-semibold text-slate-700">{title}</legend>
      {children}
    </fieldset>
  );
}
function Row({ label, value, valueCls }: { label: string; value: string; valueCls?: string }) {
  return <div className="flex gap-2"><span className="text-slate-500 w-28 shrink-0">{label}</span><span className={valueCls || 'text-slate-700'}>{value}</span></div>;
}

/* ---- Yazdırma için bağımsız HTML (doğru kağıt boyutuyla) ---- */
export function buildPrintHtml(tpl: Tpl, data: PreviewData, qr: string, noteSize: number): string {
  const logo = getLogo();
  const esc = (s?: string | null) => (s || '').replace(/</g, '&lt;');
  const productLine = (data.items && data.items.length > 0)
    ? data.items.map((i) => `${i.quantity} × ${esc(i.productName)}`).join(', ')
    : esc(data.productType);
  const cardNote = (tpl.noteContent || '{{kart_notu}}').replace('{{kart_notu}}', esc(data.cardNote));
  const landscape = tpl.rotation === 'Yatay' ? ' landscape' : '';
  const noteFf = noteFontFamily(tpl.noteFontStyle || 'Normal', tpl.noteFont || 'Varsayılan');

  const section = (title: string, body: string) =>
    `<fieldset><legend>${title}</legend>${body}</fieldset>`;

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(data.orderCode)}</title>
  <style>
    @page { size: ${tpl.paperType}${landscape}; margin: 8mm; }
    *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;margin:0;font-size:13px}
    .logo{text-align:center;margin-bottom:10px} .logo img{height:54px;max-width:220px;object-fit:contain${tpl.noteBold ? '' : ''}}
    fieldset{border:1px solid #fca5a5;border-radius:8px;padding:4px 10px 10px;margin-bottom:10px}
    legend{padding:0 6px;font-weight:600;font-size:13px}
    .row{display:flex;gap:8px} .row .lbl{color:#64748b;width:110px;flex:0 0 auto}
    .blue{color:#1d4ed8} .red{color:#dc2626;font-weight:600;margin-top:3px}
    .top{display:flex;gap:14px} .top .left{flex:1} .top .right{flex:0 0 auto;text-align:center}
    .qr{width:92px;height:92px} .price{font-weight:700;margin-top:4px}
    .right-float{float:right}
    .note{min-height:96px;display:flex;align-items:center;justify-content:center;text-align:center;padding:14px;
      font-size:${noteSize}px;color:${tpl.noteColor || '#333'};font-weight:${tpl.noteBold ? 700 : 400};
      font-style:${tpl.noteFontStyle === 'Italic' ? 'italic' : 'normal'};font-family:${noteFf}}
    .sign{display:flex;justify-content:space-between;padding-top:4px}
  </style></head><body>
    <div class="logo">${logo.src ? `<img src="${logo.src}"/>` : `<b style="font-size:22px">${esc(logo.name)}</b>`}</div>
    ${section('Sipariş Bilgileri', `<div class="top"><div class="left">
      <div class="row"><span class="lbl">Teslim Zamanı</span><span class="blue">${fmtDate(data.deliveryDate)}${data.deliveryTimeRange ? ' · ' + esc(data.deliveryTimeRange) : ''}</span></div>
      ${tpl.showOrderCode ? `<div class="row"><span class="lbl">Kod/K. Tarihi</span><span class="blue">${esc(data.orderCode)}${tpl.showCreatedDate && data.createdDate ? ' (' + fmtDateTime(data.createdDate) + ')' : ''}</span></div>` : ''}
      <div class="row"><span class="lbl">Çiçek Türü</span><span class="blue">${esc(data.items?.[0]?.productName || data.productType || '-')}</span></div>
      ${productLine ? `<div class="red">${productLine}</div>` : ''}
      ${tpl.showExtraNote ? `<div class="row"><span class="lbl">Ekstra Not</span><span>${esc(data.extraNote)}</span></div>` : ''}
      </div><div class="right">
      ${tpl.showQr && qr ? `<img class="qr" src="${qr}"/>` : ''}
      ${tpl.showPrice ? `<div class="price">${money(data.orderAmount)}</div>` : ''}
      ${tpl.showPaymentStatus && data.paymentStatus ? `<div style="font-size:11px;color:#64748b">${esc(data.paymentStatus)}</div>` : ''}
      </div></div>`)}
    ${section('Alıcı Bilgileri', `<div><b>Ad Soyad:</b> <span class="blue">${esc(data.recipientName)}</span>${tpl.showRecipientPhone ? `<span class="right-float"><b>Tel:</b> ${esc(data.recipientPhone) || '-'}</span>` : ''}</div><div style="margin-top:3px"><b>Adres:</b> ${esc(data.recipientAddress) || '-'}</div>`)}
    ${section('Gönderici Bilgileri', `<div><b>Ad Soyad:</b> <span class="blue">${esc(data.senderName)}</span>${tpl.showSenderPhone ? `<span class="right-float"><b>Tel:</b> ${esc(data.senderPhone) || '-'}</span>` : ''}</div>`)}
    ${section('Kart Notu - Şerit', `<div class="note">${cardNote || '—'}</div>`)}
    ${section('Teslim Alan', `<div class="sign"><span><b>Ad Soyad:</b> ____________</span><span><b>İmza:</b> ____________</span></div>`)}
    <script>window.onload=function(){window.print();setTimeout(function(){window.close()},300)}</script>
  </body></html>`;
}
