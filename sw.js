const CACHE_NAME = 'calcpixels-v1.6.6';
const urlsToCache = [
  '/CalcPixels/',
  '/CalcPixels/index.html',
  '/CalcPixels/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => {
        // Limpar caches antigos
        return caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                return caches.delete(cacheName);
              }
            })
          );
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Para HTML, sempre tentar network primeiro (atualizações)
  if (event.request.url.includes('index.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          // Se network funcionou, atualizar cache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se network falhou, usar cache
          return caches.match(event.request);
        })
    );
  } else {
    // Para outros recursos, usar cache primeiro
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
});

// Forçar atualização quando Service Worker é ativado
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Forçar controle da página imediatamente
      return self.clients.claim();
    })
  );
}); 