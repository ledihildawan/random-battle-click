const CACHE = 'retro-battle-v1';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/vue.js',
  './js/script.js',
  './js/services/battleEngine.js',
  './js/services/uiEffects.js',
  './js/services/soundEngine.js',
  './js/services/signatureFx.js',
  './js/services/avatarFallback.js',
  './js/utils/deepFreeze.js',
  './fonts/press-start-2p.latin.woff2',
  './img/players/player-1.jpg',
  './img/players/player-2.jpg',
  './img/players/player-3.jpg',
  './img/players/player-4.jpg',
  './img/players/player-5.jpg',
  './img/players/player-6.jpg',
  './img/players/player-7.jpg',
  './img/players/player-8.jpg',
  './img/players/player-9.jpg',
  './img/players/player-10.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.destination !== 'video') {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
