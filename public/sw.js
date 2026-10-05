// Service Worker leve para PWA e cache de recursos estáticos do myFinance
const CACHE_NAME = 'myfinance-cache-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/pwa-icon.svg',
  '/manifest.json'
]

// Instalação: pré-carrega assets fundamentais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// Ativação: remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// Estratégia de fetch:
// 1. Requisições Supabase / Auth / API -> Sempre Network First (dados sempre frescos)
// 2. Assets estáticos (JS, CSS, Imagens, Fontes) -> Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Ignora chamadas Supabase ou extensões de terceiros do cache estático
  if (url.origin.includes('supabase.co') || event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
