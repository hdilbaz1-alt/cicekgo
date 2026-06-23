'use client';
import { useEffect, useRef } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import type { MergeTag } from '@/services/emailService';

export interface GrapesHandle {
  getHtml: () => string;
  getDesign: () => string;
}

/** GrapesJS (newsletter preset) tabanlı sürükle-bırak e-posta editörü. Yalnız client; dinamik import (SSR güvenli). */
export default function GrapesEmailEditor({ initialHtml, initialDesign, mergeTags, onReady }: {
  initialHtml?: string;
  initialDesign?: string | null;
  mergeTags: MergeTag[];
  onReady: (h: GrapesHandle) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ed: any = null;
    let destroyed = false;

    (async () => {
      const grapesjs = (await import('grapesjs')).default;
      const preset = (await import('grapesjs-preset-newsletter')).default;
      if (!elRef.current || destroyed) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ed = (grapesjs as any).init({
        container: elRef.current,
        height: '100%',
        fromElement: false,
        storageManager: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins: [(e: any) => preset(e, { modalTitleImport: 'HTML İçe Aktar' })],
      });

      // Merge-tag'leri sürüklenebilir blok olarak ekle ("Değişkenler" kategorisi)
      mergeTags.forEach((t) => ed.BlockManager.add('mt-' + t.code, {
        label: t.label,
        category: 'Değişkenler',
        content: `<div data-gjs-type="text" style="display:inline-block">${t.insert}</div>`,
      }));

      // İçeriği yükle
      try {
        if (initialDesign) ed.loadProjectData(JSON.parse(initialDesign));
        else if (initialHtml) ed.setComponents(initialHtml);
      } catch { if (initialHtml) ed.setComponents(initialHtml); }

      onReadyRef.current({
        getHtml: () => ed.runCommand('gjs-get-inlined-html'),
        getDesign: () => JSON.stringify(ed.getProjectData()),
      });
    })();

    return () => { destroyed = true; try { ed?.destroy(); } catch { /* yoksay */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="gjs-editor-root h-full" ref={elRef} />;
}
