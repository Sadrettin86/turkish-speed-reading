// Çevrimdışı çalışma: önce önbellek, arkada güncelle.
const SURUM = 'tsr-v1';
const DOSYALAR = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/metin.js',
  'js/merdiven.js',
  'js/program.js',
  'js/depo.js',
  'data/on-test.json',
  'data/asama1.json',
  'data/asama2.json',
  'data/asama3.json',
  'data/olcum.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SURUM).then((c) => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((anahtarlar) => Promise.all(anahtarlar.filter((k) => k !== SURUM).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(SURUM).then(async (onbellek) => {
      const kayitli = await onbellek.match(e.request, { ignoreSearch: true });
      const ag = fetch(e.request)
        .then((yanit) => {
          if (yanit.ok) onbellek.put(e.request, yanit.clone());
          return yanit;
        })
        .catch(() => kayitli);
      return kayitli || ag;
    })
  );
});
