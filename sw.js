const CACHE='glacier-family-trip-v4';
const CORE=['./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./glacier-exact-pins.kml'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  const isPage=event.request.mode==='navigate' || event.request.destination==='document';
  if(isPage){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response && response.ok) await cache.put('./index.html',response.clone());
        return response;
      }catch(error){
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(event.request);
    if(cached) return cached;
    try{
      const response=await fetch(event.request);
      if(response && response.ok) await cache.put(event.request,response.clone());
      return response;
    }catch(error){
      return Response.error();
    }
  })());
});
