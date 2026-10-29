// Caches the app shell only (fast start, opens offline). Customer data is NEVER cached by the service worker.
const V = 'sem-v2', SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.concat([LIB]))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin !== location.origin && r.url !== LIB) return;            // Supabase API etc. -> straight to network
  if (r.mode === 'navigate') {                                            // pages: network first so updates arrive, cache fallback offline
    e.respondWith(fetch(r).then(x => { caches.open(V).then(c => c.put('./index.html', x.clone())); return x; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {                             // assets: cache first, refresh in background
    const net = fetch(r).then(x => { if (x.ok) caches.open(V).then(c => c.put(r, x.clone())); return x; }).catch(() => hit);
    return hit || net;
  }));
});
