// Take Rest - Progressive Web App Service Worker
// Enables standalone installability (WebAPK), offline resilience, and fast asset loading.

const CACHE_NAME = 'takerest-pwa-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/fonts/Kalpurush.woff2',
];

// Install Event: Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force activation immediately without waiting for existing tabs to close
        return self.skipWaiting();
      })
      .catch((error) => {
        console.warn('[SW] Pre-caching completed with non-fatal warnings:', error);
        return self.skipWaiting();
      })
  );
});

// Activate Event: Purge old cache buckets and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Deleting deprecated cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch Event: Required by Chrome/Brave WebAPK generator
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1. Only handle GET requests
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // 2. Ignore non-http/https schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Bypass external API calls (e.g. Supabase DB/auth endpoints)
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // 4. HTML Navigation Requests (SPAs): Network-first with fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cachedResponse = await caches.match(req);
          if (cachedResponse) return cachedResponse;

          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;

          return caches.match('/');
        })
    );
    return;
  }

  // 5. Static Assets (fonts, images, scripts, styles): Cache-first with background revalidation
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network failed and nothing in cache, allow browser default handling
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle incoming messages (e.g. manual update prompts)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
