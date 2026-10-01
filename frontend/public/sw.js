/* eslint-disable no-restricted-globals */
/**
 * ChatVerse service worker — push notifications only.
 *
 * Deliberately has no `fetch` handler: the app is not cached offline, so a
 * deploy never serves stale assets.
 */

// Take over immediately instead of waiting for every old tab to close.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || 'New message';
  const roomName = data.roomName || 'ChatVerse';

  event.waitUntil(
    (async () => {
      // A tab may have opened between the server deciding to push and this
      // worker waking up; if one is focused, the user is already looking.
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      if (clients.some((client) => client.focused && client.visibilityState === 'visible')) {
        return;
      }

      await self.registration.showNotification(`${title} · ${roomName}`, {
        body: data.body || '',
        icon: '/logo192.png',
        badge: '/logo192.png',
        // Same tag per room means a burst of messages collapses into one entry
        // that keeps updating, rather than a stack of toasts.
        tag: `chatverse-${data.roomId || 'room'}`,
        renotify: true,
        timestamp: data.at ? new Date(data.at).getTime() : undefined,
        data: { url: '/chat', roomId: data.roomId },
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Reuse an existing tab when there is one, rather than piling up windows.
      for (const client of clients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client && !client.url.includes('/chat')) {
            await client.navigate('/chat');
          }
          return;
        }
      }

      await self.clients.openWindow('/chat');
    })()
  );
});
