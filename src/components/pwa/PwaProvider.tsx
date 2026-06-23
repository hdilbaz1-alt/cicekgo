'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }>; }

export default function PwaProvider() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    // ── Service Worker kayıt + güncelleme algılama ──
    if ('serviceWorker' in navigator) {
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return; reloaded = true; window.location.reload();
      });
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing; if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(reg.waiting);
          });
        });
        // uzun oturumlarda da periyodik kontrol
        const iv = setInterval(() => reg.update().catch(() => {}), 60_000);
        return () => clearInterval(iv);
      }).catch(() => {});
    }

    // ── Kurulum (Add to Home Screen) tetikleyici ──
    const onBIP = (e: Event) => { e.preventDefault(); setInstallEvt(e as BIPEvent); };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  const doUpdate = () => waiting?.postMessage({ type: 'SKIP_WAITING' });
  const doInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    try { await installEvt.userChoice; } catch { /* */ }
    setInstallEvt(null);
  };

  return (
    <>
      {installEvt && !installDismissed && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[120] w-[92%] max-w-[440px] bg-white border border-slate-200 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <Download className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800">ÇiçekGo’yu yükle</div>
            <div className="text-[11px] text-slate-500">Ana ekrana ekle, uygulama gibi kullan.</div>
          </div>
          <button onClick={doInstall} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold shrink-0">Yükle</button>
          <button onClick={() => setInstallDismissed(true)} className="text-slate-400 shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      {waiting && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[120] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <RefreshCw className="w-4 h-4 text-indigo-300" />
          <span className="text-sm font-medium">Yeni güncelleme var</span>
          <button onClick={doUpdate} className="bg-indigo-600 px-3 py-1.5 rounded-xl text-sm font-semibold">Yenile</button>
        </div>
      )}
    </>
  );
}
