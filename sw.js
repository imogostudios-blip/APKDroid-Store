const CACHE = 'apkdroid-v43';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './src/styles/tailwind.css',
  './src/styles/app.css',
  './src/app.js',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './res/fonts/fonts.css',
  './res/fonts/f0.woff2',
  './res/fonts/f1.woff2',
  './res/fonts/f2.woff2',
  './res/fonts/f3.woff2',
  './res/icons/icon-128.png',
  './res/icons/icon-144.png',
  './res/icons/icon-152.png',
  './res/icons/icon-192.png',
  './res/icons/icon-384.png',
  './res/icons/icon-48.png',
  './res/icons/icon-512-maskable.png',
  './res/icons/icon-512.png',
  './res/icons/icon-72.png',
  './res/icons/icon-96.png',
  './res/icons/icon-source.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const shellPath = (pathname) => {
  return /\/(index\.html|src\/app\.js|src\/styles\/app\.css|src\/styles\/tailwind\.css|manifest\.json)$/.test(pathname)
    || pathname.endsWith('/');
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never serve sw.js from cache, or the browser will never see a new version.
  if (url.pathname.endsWith('/sw.js')) return;

  if (shellPath(url.pathname)) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-store' });
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      } catch (err) {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        if (req.mode === 'navigate') {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
      }
      return res;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
