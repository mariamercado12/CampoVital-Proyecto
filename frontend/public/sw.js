// ==============================================================================
// AgroSmart Magdalena — Service Worker (PWA ligera)
// Estrategia: Cache-first para assets estáticos, Network-first para API
// ==============================================================================

const CACHE_NAME = 'agrosmart-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalación: cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Estrategia diferenciada
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Peticiones a la API
  if (request.url.includes('/api/')) {
    // IMPORTANTE: Solo interceptamos GET. Login/Registro (POST) van directo al servidor.
    if (request.method === 'GET') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => caches.match(request))
      );
    }
    // Si no es GET (POST/PUT/DELETE), no hacemos nada y el navegador lo maneja normal
    return;
  }

  // 2. Assets estáticos (Cache-first)
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

