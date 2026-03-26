const CACHE_NAME='mostaqbaly-premium-v1';

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate',event=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).catch(()=>cached))
  );
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const targetUrl=(event.notification.data&&event.notification.data.url)||'./';
  event.waitUntil(
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
      for(const client of clients){
        if('focus' in client)return client.focus();
      }
      if(self.clients.openWindow)return self.clients.openWindow(targetUrl);
    })
  );
});
