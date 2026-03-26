const CACHE_VERSION = 'mostaqbaly-premium-v6';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL = [
  './',
  './index.html',
  './index%20(6).html',
  './admin.html',
  './manifest.json',
  './icon.png',
  './logo-dark.png',
  './logo-light.png'
];

function isHttpRequest(request) {
  return request.url.startsWith('http://') || request.url.startsWith('https://');
}

async function fromCache(request) {
  return caches.match(request, { ignoreSearch: true });
}

async function updateRuntimeCache(request) {
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !isHttpRequest(request)) return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          return (
            await fromCache(request) ||
            await fromCache('./index%20(6).html') ||
            await fromCache('./index.html') ||
            await fromCache('./')
          );
        })
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      fromCache(request).then(async cached => {
        if (cached) {
          updateRuntimeCache(request).catch(() => {});
          return cached;
        }
        try {
          return await updateRuntimeCache(request);
        } catch (error) {
          return cached || fromCache('./index%20(6).html');
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) {
        updateRuntimeCache(request).catch(() => {});
        return cached;
      }
      try {
        return await updateRuntimeCache(request);
      } catch (error) {
        return cached;
      }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
