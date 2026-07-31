/* ============================================================
   时宜的工作台 - Service Worker (v7 PUSH)
   支持 Web Push 推送通知，不缓存任何资源。
   ============================================================ */

const SW_VERSION = 'v19-multi-classify';

// Install: 立即跳过等待
self.addEventListener('install', event => {
  console.log('[SW ' + SW_VERSION + '] Installing');
  self.skipWaiting();
});

// Activate: 删除旧缓存 + 接管客户端（不注销自己）
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // 1. 删除所有旧 Cache Storage
      try {
        const keys = await caches.keys();
        if (keys.length > 0) {
          console.log('[SW ' + SW_VERSION + '] Deleting caches:', keys);
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch (e) {
        console.warn('[SW] Cache cleanup error:', e);
      }

      // 2. 接管所有客户端
      await self.clients.claim();
      console.log('[SW ' + SW_VERSION + '] Activated and claimed clients');
    })()
  );
});

// 不注册 fetch 事件 = SW 不拦截任何请求，浏览器直接走网络

// ===== Push 事件：显示通知 =====
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event);

  let data = { title: '时宜的工作台', body: '你有一条新提醒' };
  try {
    if (event.data) {
      const text = event.data.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data.body = text;
      }
    }
  } catch (e) {
    console.warn('[SW] Push data parse error:', e);
  }

  const options = {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: data.tag || 'reminder',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/'
    },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '时宜的工作台', options)
  );
});

// ===== 通知点击：打开/聚焦 App =====
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click:', event);
  event.notification.close();

  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // 尝试聚焦已打开的窗口
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // 没有打开的窗口，打开新窗口
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ===== 消息处理 =====
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
