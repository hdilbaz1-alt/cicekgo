import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export const pushService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  permission(): NotificationPermission {
    return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
  },

  /** Bu cihaz şu an abone mi (izin verilmiş + aktif pushManager aboneliği var). */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported() || this.permission() !== 'granted') return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      return !!(await reg.pushManager.getSubscription());
    } catch { return false; }
  },

  /** iOS Safari'de yalnız ana ekrana eklenmiş (standalone) PWA'da push desteklenir. */
  iosNeedsInstall(): boolean {
    if (typeof navigator === 'undefined') return false;
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // @ts-expect-error iOS standalone
    const standalone = window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
    return iOS && !standalone;
  },

  /** İzin ister, abone olur, backend'e kaydeder. Başarısızsa açıklayıcı hata fırlatır. */
  async subscribe(): Promise<boolean> {
    if (this.iosNeedsInstall()) throw new Error('iPhone’da önce "Ana Ekrana Ekle" yapıp uygulamadan açın.');
    if (!this.isSupported()) throw new Error('Bu tarayıcı anlık bildirimi desteklemiyor.');

    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Bildirim izni verilmedi.');

    const reg = await navigator.serviceWorker.ready;

    const res = await apiFetch(getApiUrl(getEndpoint('NOTIF_VAPID')), { headers: auth() });
    const body = await res.json().catch(() => null);
    const pub: string | null = body?.data;
    if (!pub) throw new Error('Sunucu anahtarı (VAPID) alınamadı.');

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pub) as BufferSource,
      });
    }
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    const sres = await apiFetch(getApiUrl(getEndpoint('NOTIF_SUBSCRIBE')), {
      method: 'POST', headers: auth(),
      body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth, userAgent: navigator.userAgent }),
    });
    const sbody = await sres.json().catch(() => null);
    if (!sres.ok || sbody?.success === false) throw new Error(sbody?.message || 'Abonelik kaydedilemedi.');
    return true;
  },

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await apiFetch(getApiUrl(getEndpoint('NOTIF_UNSUBSCRIBE')), {
      method: 'POST', headers: auth(), body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  },

  async test(): Promise<void> {
    await apiFetch(getApiUrl(getEndpoint('NOTIF_TEST')), { method: 'POST', headers: auth() });
  },

  async broadcast(payload: { title: string; body: string; url?: string; scope: 'tenant' | 'all'; tenantId?: number }): Promise<number> {
    const res = await apiFetch(getApiUrl(getEndpoint('NOTIF_BROADCAST')), { method: 'POST', headers: auth(), body: JSON.stringify(payload) });
    const b = await res.json();
    if (!res.ok || b.success === false) throw new Error(b.message || 'Gönderilemedi');
    return b.data as number;
  },
};
