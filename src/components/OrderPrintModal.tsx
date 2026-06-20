'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { orderService, OrderItem } from '@/services/orderService';
import { templateService, PrintTemplate } from '@/services/templateService';
import { useEscClose } from '@/lib/useEscClose';
import { X, Printer } from 'lucide-react';
import TemplatePreview, { buildPrintHtml, PreviewData } from './TemplatePreview';
import { parseDoc, DocRenderer, buildDocPrintHtml, PXMM } from '@/lib/printDoc';

export default function OrderPrintModal({ order, onClose }: { order: OrderItem; onClose: () => void }) {
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [tplId, setTplId] = useState<number | null>(null);
  const [detail, setDetail] = useState<OrderItem>(order);
  const [qr, setQr] = useState('');
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  useEscClose(onClose);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tpls, d] = await Promise.all([
        templateService.list().catch(() => [] as PrintTemplate[]),
        orderService.getOrderDetail(order.orderCode).catch(() => order),
      ]);
      setTemplates(tpls);
      setTplId(tpls.find((t) => t.isDefault)?.id ?? tpls[0]?.id ?? null);
      setDetail(d);
      try { setQr(await QRCode.toDataURL(order.orderCode, { margin: 1, width: 160 })); } catch { /* yoksay */ }
    } finally { setLoading(false); }
  }, [order]);
  useEffect(() => { load(); }, [load]);

  const tpl = useMemo(() => templates.find((t) => t.id === tplId) || null, [templates, tplId]);
  const noteSize = fontSize ?? tpl?.noteFontSize ?? 18;

  const data: PreviewData = detail as PreviewData;
  const doc = useMemo(() => parseDoc(tpl?.elementsJson), [tpl]);

  const print = () => {
    if (!tpl) return;
    const html = doc ? buildDocPrintHtml(doc, data, qr) : buildPrintHtml(tpl, data, qr, noteSize);
    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) { alert('Pop-up engellendi. Lütfen tarayıcıdan izin verin.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      <div className="bg-white border-b border-slate-200 px-3 sm:px-5 h-14 flex items-center gap-2 shrink-0">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        <span className="font-semibold text-slate-800 truncate">Sipariş Yazdır · {order.orderCode}</span>
        <div className="ml-auto flex items-center gap-2">
          <select value={tplId ?? ''} onChange={(e) => { setTplId(Number(e.target.value)); setFontSize(null); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm max-w-[160px] sm:max-w-[220px]">
            {templates.length === 0 && <option>Şablon yok</option>}
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (varsayılan)' : ''}</option>)}
          </select>
          <button onClick={print} disabled={!tpl} className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25 disabled:opacity-50">
            <Printer className="w-4 h-4" /> Yazdır
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center gap-4">
        {loading || !tpl ? (
          <div className="text-slate-400 py-20">Yükleniyor…</div>
        ) : (
          <>
            {doc ? (
              <div className="shadow-xl"><DocRenderer doc={doc} data={data} qr={qr} scale={PXMM} /></div>
            ) : (
              <>
                <div className="shadow-xl rounded-lg"><TemplatePreview tpl={tpl} data={data} qr={qr} noteSize={noteSize} /></div>
                <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 w-full max-w-[560px]">
                  <span className="text-xs text-slate-500 shrink-0">Kart Notu Font Boyutu</span>
                  <input type="range" min={10} max={48} value={noteSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1 accent-blue-600" />
                  <span className="text-xs text-slate-400 w-8 text-right">{noteSize}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
