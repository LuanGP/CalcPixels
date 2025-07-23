const CACHE_NAME = 'calcpixels-v1.7.1';
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
  // Para HTML, NÃO interceptar - deixar o navegador buscar diretamente
  if (event.request.url.includes('index.html')) {
    return;
  }
  
  // Para outros recursos, usar cache
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
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