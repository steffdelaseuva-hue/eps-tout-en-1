// EPS Tout en 1 — fonctionnement hors ligne (réseau d'abord, cache en secours)
const CACHE = 'eps-tout-en-1-v16';
const FILES = ['./', './index.html', './js/icons.js', './js/outils-plus.js', './js/test-vma.js', './js/import-classes.js', './js/niveaux.js', './js/match.js', './js/qr.js', './js/plus.js', './js/musique.js', './outils/chronos-eps.html',
  './manifest.webmanifest', './icons/icone-v2-192.png', './icons/chronos-eps.png', './icons/icone-v2-512.png', './icons/icone-v2-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request)));
});
