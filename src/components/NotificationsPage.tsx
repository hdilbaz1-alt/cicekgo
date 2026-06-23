'use client';

import { useEffect, useState } from 'react';
import { can, P } from '@/lib/permissions';
import { pushService } from '@/services/pushService';
import { Bell, BellOff, Share } from 'lucide-react';

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm';

export default function NotificationsPage() {
  const [perm, setPerm] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [iosInstall, setIosInstall] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const note = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  useEffect(() => {
    setSupported(pushService.isSupported());
    setPerm(pushService.permission());
    setIosInstall(pushService.iosNeedsInstall());
    pushService.isSubscribed().then(setSubscribed).catch(() => { });
  }, []);

  const enable = async () => {
    setBusy(true);
    try { await pushService.subscribe(); setPerm(pushService.permission()); setSubscribed(true); note('Bildirimler açıldı 🔔'); }
    catch (e) { note(e instanceof Error ? e.message : 'Açılamadı'); } finally { setBusy(false); }
  };
  const disable = async () => { setBusy(true); try { await pushService.unsubscribe(); setSubscribed(false); note('Bildirimler kapatıldı'); } finally { setBusy(false); } };
  const test = async () => { try { await pushService.test(); note('Test bildirimi gönderildi'); } catch { note('Gönderilemedi'); } };

  // Yayın (yetkiliyse)
  const canSend = can(P.notificationsSend);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!title.trim()) return note('Başlık gerekli');
    setSending(true);
    try { const n = await pushService.broadcast({ title: title.trim(), body: body.trim(), url: url.trim() || undefined, scope: 'tenant' }); note(`${n} cihaza gönderildi`); setTitle(''); setBody(''); setUrl(''); }
    catch (e) { note(e instanceof Error ? e.message : 'Gönderilemedi'); } finally { setSending(false); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8 max-w-[800px]">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Bildirimler</h1>
        <p className="text-slate-500 text-sm mb-6">Cihazına anlık bildirim al; yeni sipariş/kurye bildirimleri buradan etkinleşir.</p>

        {/* Bildirim aç/kapat */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-1"><Bell className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-slate-800">Bu Cihazda Bildirimler</h3></div>
          {!supported ? (
            <p className="text-sm text-slate-400 mt-1">Bu tarayıcı anlık bildirimi desteklemiyor.</p>
          ) : iosInstall ? (
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 flex-wrap">iPhone’da bildirim için: <Share className="w-4 h-4" /> Paylaş → <b>Ana Ekrana Ekle</b>, sonra uygulamadan aç.</p>
          ) : perm === 'denied' ? (
            <p className="text-sm text-amber-600 mt-1">Bildirim izni engellenmiş. Tarayıcı/site ayarlarından izin verin.</p>
          ) : subscribed ? (
            <div className="mt-3">
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl mb-3"><Bell className="w-4 h-4" /> Bu cihazda bildirimler açık</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={test} className="px-5 py-2.5 rounded-2xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Test Gönder</button>
                <button onClick={disable} disabled={busy} className="px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-400 inline-flex items-center gap-1 disabled:opacity-50"><BellOff className="w-4 h-4" />Kapat</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={enable} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50">{busy ? 'Açılıyor…' : 'Bildirimleri Aç'}</button>
            </div>
          )}
        </div>

        {/* Yayın (yetkili) */}
        {canSend && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-1">Toplu Bildirim Gönder</h3>
            <p className="text-xs text-slate-400 mb-4">Firmanızdaki bildirim aboneliği olan tüm kullanıcılara gönderilir.</p>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-slate-600">Başlık</label><input className={inputCls + ' mt-1'} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Duyuru" /></div>
              <div><label className="text-xs font-medium text-slate-600">Mesaj</label><textarea className={inputCls + ' mt-1'} rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Bildirim metni" /></div>
              <div><label className="text-xs font-medium text-slate-600">Bağlantı (opsiyonel)</label><input className={inputCls + ' mt-1'} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/?go=order&code=..." /></div>
              <button onClick={send} disabled={sending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{sending ? 'Gönderiliyor…' : 'Gönder'}</button>
            </div>
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}
