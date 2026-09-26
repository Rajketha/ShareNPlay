// ShareNPlay service worker — runtime-first strategy
// Never pre-caches hashed CRA assets (they change every build); serves a
// network-first shell with cache fallback so the PWA opens offline.
const CACHE = 'snp-runtime-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // skip fonts/CDN/socket.io

  // API + file endpoints: always live (uploads, dares, health)
  if (/^\/(api|upload|fileinfo|download|dare)/.test(url.pathname)) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('/index.html')))
  );
});
