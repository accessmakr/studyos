/* =========================================
   StudyOS Service Worker — v2.0
   Caches the app shell for offline use.
   API calls (Groq, Gemini, Claude) always
   go live — never cached.
   ========================================= */

const CACHE = 'studyos-v2';

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

/* --- SKIP THESE (always live) --- */
const SKIP = [
  'api.groq.com',
  'googleapis.com',
  'api.anthropic.com',
  'supabase.co',
  'allorigins.win',
  'corsproxy.io',
  'jsdelivr.net/npm/@supabase'
];

/* --- INSTALL: cache shell --- */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        SHELL.map(url =>
          cache.add(new Request(url, { mode: 'cors', credentials: 'omit' }))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

/* --- ACTIVATE: remove old caches --- */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* --- FETCH: cache-first for shell, network for API --- */
self.addEventListener('fetch', e => {
  const url = e.request.url;

  /* Always go network for API calls */
  if (SKIP.some(domain => url.includes(domain))) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        /* Cache successful GET responses */
        if (response.ok && response.status < 400) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        /* Offline fallback: serve index.html for navigation */
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

/* --- MESSAGE: force update from UI --- */
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
