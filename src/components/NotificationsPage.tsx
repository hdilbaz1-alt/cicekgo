'use client';

import { useEffect, useState } from 'react';
import { can, P } from '@/lib/permissions';
import { pushService } from '@/services/pushService';
import { notificationService, type NotificationItem } from '@/services/notificationService';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Bell, Share, CheckCheck, Inbox, Settings2, Megaphone } from 'lucide-react';

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm';

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const s = Math.max(0, (Date.now() - d) / 1000);
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  if (s < 604800) return `${Math.floor(s / 86400)} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR');
}

export default function NotificationsPage({ onNavigate }: { onNavigate?: (page: string, opts?: Record<string, unknown>) => void }) {
  // Gelen bildirim akışı
  const [feed, setFeed] = useState<NotificationItem[]>([]);
  const loadFeed = () => notificationService.list(50).then(setFeed);
  useEffect(() => { loadFeed(); }, []);
  const feedUnread = feed.filter((n) => !n.isRead).length;
  const onFeedClick = async (n: NotificationItem) => {
    if (!n.isRead) { await notificationService.markRead(n.id); setFeed((p) => p.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))); }
    if (n.url && onNavigate) {
      try { const u = new URL(n.url, window.location.origin); if (u.searchParams.get('go') === 'order' && u.searchParams.get('code')) { onNavigate('orders', { openOrderCode: u.searchParams.get('code')! }); return; } } catch { /* yoksay */ }
    }
  };
  const feedMarkAll = async () => { await notificationService.markAllRead(); setFeed((p) => p.map((x) => ({ ...x, isRead: true }))); };

  // Cihaz bildirim ayarları
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

  const toggleDevice = async (on: boolean) => {
    setBusy(true);
    try {
      if (on) { await pushService.subscribe(); setPerm(pushService.permission()); setSubscribed(true); note('Bildirimler açıldı 🔔'); }
      else { await pushService.unsubscribe(); setSubscribed(false); note('Bildirimler kapatıldı'); }
    } catch (e) { note(e instanceof Error ? e.message : 'İşlem başarısız'); } finally { setBusy(false); }
  };
  const test = async () => { try { await pushService.test(); note('Test bildirimi gönderildi'); } catch { note('Gönderilemedi'); } };

  // Yayın (yetkiliyse)
  const canSend = can(P.notificationsSend);
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [url, setUrl] = useState('');
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!title.trim()) return note('Başlık gerekli');
    setSending(true);
    try { const n = await pushService.broadcast({ title: title.trim(), body: body.trim(), url: url.trim() || undefined, scope: 'tenant' }); note(`${n} cihaza gönderildi`); setTitle(''); setBody(''); setUrl(''); }
    catch (e) { note(e instanceof Error ? e.message : 'Gönderilemedi'); } finally { setSending(false); }
  };

  const canToggle = supported && !iosInstall && perm !== 'denied';

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8 max-w-[920px]">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Bildirimler</h1>
        <p className="text-slate-500 text-sm mb-6">Gelen bildirimlerini gör ve cihaz bildirim ayarlarını yönet.</p>

        <Tabs defaultValue="feed">
          <TabsList>
            <TabsTrigger value="feed"><Inbox className="w-4 h-4" /> Gelen Bildirimler{feedUnread > 0 ? ` (${feedUnread})` : ''}</TabsTrigger>
            <TabsTrigger value="settings"><Settings2 className="w-4 h-4" /> Bildirim Ayarları</TabsTrigger>
          </TabsList>

          {/* Gelen Bildirimler */}
          <TabsContent value="feed">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Gelen Bildirimler{feedUnread > 0 ? ` · ${feedUnread} okunmamış` : ''}</h3>
                {feedUnread > 0 && <button onClick={feedMarkAll} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"><CheckCheck className="w-3.5 h-3.5" /> Tümünü okundu işaretle</button>}
              </div>
              {feed.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-300 mx-auto mb-3 flex items-center justify-center"><Bell className="w-7 h-7" /></div>
                  <p className="text-sm text-slate-400">Henüz bildirim yok</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
                  {feed.map((n) => (
                    <button key={n.id} onClick={() => onFeedClick(n)} className={`w-full text-left px-5 py-3.5 flex gap-3 transition-colors hover:bg-slate-50 ${n.isRead ? '' : 'bg-indigo-50/50'}`}>
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-indigo-500'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-800">{n.title}</span>
                        <span className="block text-[13px] text-slate-500">{n.body}</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAtUtc)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Bildirim Ayarları */}
          <TabsContent value="settings">
            <div className="space-y-5">
              <Card className="p-6 max-w-[560px]">
                <div className="flex items-center gap-2 mb-3"><Bell className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-slate-800">Bu Cihazda Bildirimler</h3></div>

                <div className="flex items-center justify-between gap-4 bg-slate-50 rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800">Anlık bildirimler</div>
                    <div className="text-xs text-slate-400">{subscribed ? 'Bu cihazda açık' : 'Bu cihazda kapalı'}</div>
                  </div>
                  <Switch checked={subscribed} disabled={!canToggle || busy} onCheckedChange={toggleDevice} />
                </div>

                {!supported ? (
                  <p className="text-sm text-slate-400 mt-3">Bu tarayıcı anlık bildirimi desteklemiyor.</p>
                ) : iosInstall ? (
                  <p className="text-sm text-slate-500 mt-3 flex items-center gap-1 flex-wrap">iPhone’da bildirim için: <Share className="w-4 h-4" /> Paylaş → <b>Ana Ekrana Ekle</b>, sonra uygulamadan aç.</p>
                ) : perm === 'denied' ? (
                  <p className="text-sm text-amber-600 mt-3">Bildirim izni engellenmiş. Tarayıcı/site ayarlarından izin verin.</p>
                ) : subscribed ? (
                  <button onClick={test} className="mt-3 px-5 py-2.5 rounded-2xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Test Bildirimi Gönder</button>
                ) : null}
              </Card>

              {canSend && (
                <Card className="p-6 max-w-[560px]">
                  <div className="flex items-center gap-2 mb-1"><Megaphone className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-slate-800">Toplu Bildirim Gönder</h3></div>
                  <p className="text-xs text-slate-400 mb-4">Firmanızdaki tüm kullanıcılara gönderilir.</p>
                  <div className="space-y-3">
                    <div><label className="text-xs font-medium text-slate-600">Başlık</label><input className={inputCls + ' mt-1'} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Duyuru" /></div>
                    <div><label className="text-xs font-medium text-slate-600">Mesaj</label><textarea className={inputCls + ' mt-1'} rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Bildirim metni" /></div>
                    <div><label className="text-xs font-medium text-slate-600">Bağlantı (opsiyonel)</label><input className={inputCls + ' mt-1'} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/?go=order&code=..." /></div>
                    <button onClick={send} disabled={sending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{sending ? 'Gönderiliyor…' : 'Gönder'}</button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}
