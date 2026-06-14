const CACHE = 'studyos-v2';
const SHELL = ['/', '/index.html', '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'];
const SKIP = ['netlify/functions','api.groq.com','googleapis.com','anthropic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.allSettled(SHELL.map(u => c.add(new Request(u,{mode:'cors',credentials:'omit'}))))
  ).then(()=> self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ).then(()=> self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(SKIP.some(s=>e.request.url.includes(s))) return;
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(r => {
        if(r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c))}
        return r;
      }).catch(()=> e.request.mode==='navigate'?caches.match('/index.html'):undefined);
    })
  );
});
