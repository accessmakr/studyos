const V = 'studyos-v3';
const SHELL = ['/', '/index.html', '/manifest.json'];
const SKIP  = ['.netlify/functions', 'api.groq.com', 'googleapis.com',
               'anthropic.com', 'supabase.co', 'jina.ai', 'paystack'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c =>
      Promise.allSettled(SHELL.map(u =>
        c.add(new Request(u, { mode: 'cors', credentials: 'omit' }))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (SKIP.some(s => e.request.url.includes(s))) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r.ok) {
          const cl = r.clone();
          caches.open(V).then(c => c.put(e.request, cl));
        }
        return r;
      }).catch(() =>
        e.request.mode === 'navigate' ? caches.match('/index.html') : undefined
      );
    })
  );
});
