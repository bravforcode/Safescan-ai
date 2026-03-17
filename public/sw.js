// SafeScan AI — Service Worker
// Strategies: Cache-first (static assets) · Network-first (navigation) · Network-only (API)

const CACHE_NAME    = 'safescan-v1';
const OFFLINE_URL   = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE_URLS = ['/', '/scan', '/alerts'];

// ── Lifecycle ────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch handler ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Skip Supabase & Open Food Facts API calls — always network-only
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('openfoodfacts.org') ||
    url.hostname.includes('openbeautyfacts.org') ||
    url.hostname.includes('openpetfoodfacts.org')
  ) return;

  // Skip Google Fonts — browser caches these well already
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) return;

  // Navigation requests: Network-first, fallback to cache, fallback to root
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached ?? caches.match('/'))
        )
    );
    return;
  }

  // Static assets (JS, CSS, images, SVG, fonts): Cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/)
  ) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'SafeScan AI', {
      body:    data.body    ?? '',
      icon:    data.icon    ?? '/icon.svg',
      badge:   data.badge   ?? '/icon.svg',
      tag:     data.tag     ?? 'safescan',
      data:    data.url     ?? '/',
      actions: data.actions ?? [],
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data ?? '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else self.clients.openWindow(url);
    })
  );
});
