// Service Worker para InnovaEDU - Narrativas Interactivas
const CACHE_NAME = 'innovaedu-v1.0.0';
const urlsToCache = [
  '/',
  '/app.html',
  '/styles.css',
  '/games.css',
  '/juego_primer_dia.html',
  '/juego_companero.html',
  '/laboratorio_sensoriomotor.html',
  '/cuento_emotivo.md',
  '/regreso_al_campo.md',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Error durante la instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de caché: Cache First con Network Fallback
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver desde caché si existe
        if (response) {
          console.log('[SW] Sirviendo desde caché:', event.request.url);
          return response;
        }

        // Si no está en caché, hacer petición de red
        console.log('[SW] Sirviendo desde red:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Verificar que la respuesta sea válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para poder usarla tanto para el caché como para devolverla
            const responseToCache = response.clone();

            // Agregar al caché solo si es uno de nuestros archivos
            if (shouldCache(event.request.url)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Si la red falla, intentar servir una página de respaldo
            if (event.request.destination === 'document') {
              return caches.match('/app.html');
            }
          });
      })
  );
});

// Función para determinar si un recurso debe ser cacheado
function shouldCache(url) {
  const urlObj = new URL(url);
  
  // Cachear archivos estáticos de nuestro dominio
  return urlObj.origin === self.location.origin && 
         (url.endsWith('.html') || 
          url.endsWith('.css') || 
          url.endsWith('.js') || 
          url.endsWith('.md') ||
          url.endsWith('.json'));
}

// Manejar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificar cuando hay una nueva versión disponible
self.addEventListener('updatefound', () => {
  console.log('[SW] Nueva versión disponible');
});

// Log de errores
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

// Log cuando el SW está listo
self.addEventListener('ready', () => {
  console.log('[SW] Service Worker está listo y controlando la aplicación');
});