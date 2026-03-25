const CACHE = 'mostaqbaly-v3';
const ASSETS = ['/', '/index.html', '/logo-dark.png', '/logo-light.png', '/manifest.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
