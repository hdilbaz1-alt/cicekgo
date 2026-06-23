/* ÇiçekGo Service Worker — SADECE Web Push + güncelleme yaşam döngüsü.
   fetch handler YOK: SW hiçbir isteğe (HTML/RSC/statik) karışmaz → sayfa içeriği asla bozulamaz.
   (Statik export + App Router RSC akışı tamamen tarayıcı/nginx tarafından sunulur.) */
const BUILD_ID = '__BUILD_ID__';                 // build sonrası stamp-sw.mjs ile damgalanır

self.addEventListener('install', () => {
  self.skipWaiting();                            // yeni sürüm hemen devralsın
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Eski sürümlerin bıraktığı tüm cache'leri temizle (navigasyon cache'i dahil)
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: 'ÇiçekGo', body: event.data && event.data.text() }; }
  const title = d.title || 'ÇiçekGo';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: d.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: d.tag,
    data: { url: d.url || '/' },
    vibrate: [80, 40, 80]
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { try { await c.navigate(target); } catch (_) {} return c.focus(); }
    }
    return self.clients.openWindow(target);
  })());
});
