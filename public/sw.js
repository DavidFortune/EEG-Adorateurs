// Service Worker pour EEG Adorateurs
const CACHE_NAME = 'eeg-adorateurs-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie de cache : Network First puis Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la requête réussit, on met à jour le cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Si network échoue, on sert depuis le cache
        return caches.match(event.request);
      })
  );
});

// Gestion des Push Notifications
self.addEventListener('push', event => {
  console.log('Push notification reçue:', event);
  
  let notificationData = {
    title: 'EEG Adorateurs',
    body: 'Nouvelle notification d\'EEG Adorateurs'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'EEG Adorateurs',
        body: data.body || data.message || 'Nouvelle notification'
      };
    } catch (e) {
      notificationData.body = event.data.text() || 'Nouvelle notification d\'EEG Adorateurs';
    }
  }

  const options = {
    body: notificationData.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'eeg-notification',
    requireInteraction: false,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Ouvrir l\'app',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  console.log('Notification cliquée:', event);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Pour l'action 'open' ou un clic direct sur la notification
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Chercher si une fenêtre de l'app est déjà ouverte
      for (let client of clientList) {
        if (client.url === self.location.origin + '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si aucune fenêtre n'est ouverte, en ouvrir une nouvelle
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.url || '/';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Gestion des messages du client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});