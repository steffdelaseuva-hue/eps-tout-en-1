// EPS ONE — fonctionnement hors ligne (réseau d'abord, cache en secours)
const CACHE = 'eps-one-v38';
const FILES = ['./', './index.html', './js/icons.js', './js/outils-plus.js', './js/test-vma.js', './js/import-classes.js', './js/niveaux.js', './js/match.js', './js/orientation.js', './js/natation.js', './js/crosstraining.js', './js/parkour.js', './js/duathlon.js', './js/combine.js', './js/sauvegardes.js', './js/grilles.js', './js/qr.js', './js/plus.js', './js/musique.js', './js/firebase-config.js', './js/sync.js', './outils/chronos-eps.html',
  './manifest.webmanifest', './icons/icone-v3-192.png', './icons/chronos-eps.png', './icons/icone-v3-512.png', './icons/icone-v3-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin && !u.href.startsWith('https://www.gstatic.com/firebasejs/')) return; // Firebase (auth, base de données) : jamais mis en cache
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request)));
});
