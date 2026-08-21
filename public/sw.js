// Service Worker Básico para Ativar a PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Permite que o app faça as requisições normais da rede
    event.respondWith(fetch(event.request));
});