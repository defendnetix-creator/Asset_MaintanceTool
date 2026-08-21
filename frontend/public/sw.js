// frontend/public/sw.js
// Custom service worker for background sync

const CACHE_NAME = 'assetmt-v1';
const OFFLINE_QUEUE_KEY = 'assetmt_offline_queue';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/pwa-192x192.svg',
        '/pwa-512x512.svg',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests for NetworkFirst strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Static assets - CacheFirst
  event.respondWith(cacheFirst(event.request));
});

// Network first strategy for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open('api-cache');
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open('static-cache');
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'scan-sync') {
    event.waitUntil(syncScans());
  } else if (event.tag === 'audit-sync') {
    event.waitUntil(syncAudits());
  } else if (event.tag === 'asset-sync') {
    event.waitUntil(syncAssets());
  }
});

// Sync queued scans
async function syncScans() {
  const queue = await getQueue();
  const scanActions = queue.filter(action => action.type === 'scan');
  
  for (const action of scanActions) {
    try {
      const response = await fetch('/api/audits/' + action.payload.auditId + '/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ asset_tag: action.payload.tag, status: action.payload.status }),
      });
      
      if (response.ok) {
        await removeFromQueue(action.id);
      }
    } catch (error) {
      console.error('Failed to sync scan:', action.id, error);
    }
  }
}

// Sync queued audits
async function syncAudits() {
  const queue = await getQueue();
  const auditActions = queue.filter(action => action.type === 'audit');
  
  for (const action of auditActions) {
    try {
      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(action.payload),
      });
      
      if (response.ok) {
        await removeFromQueue(action.id);
      }
    } catch (error) {
      console.error('Failed to sync audit:', action.id, error);
    }
  }
}

// Sync queued assets
async function syncAssets() {
  const queue = await getQueue();
  const assetActions = queue.filter(action => action.type === 'asset');
  
  for (const action of assetActions) {
    try {
      const response = await fetch('/api/assets', {
        method: action.payload.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(action.payload.data),
      });
      
      if (response.ok) {
        await removeFromQueue(action.id);
      }
    } catch (error) {
      console.error('Failed to sync asset:', action.id, error);
    }
  }
}

// Get queue from IndexedDB
async function getQueue() {
  return new Promise((resolve) => {
    const request = indexedDB.open('assetmt-offline', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    };
    
    request.onerror = () => resolve([]);
  });
}

// Remove from queue
async function removeFromQueue(id: string) {
  return new Promise((resolve) => {
    const request = indexedDB.open('assetmt-offline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    };
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/pwa-192x192.svg',
    badge: '/pwa-192x192.svg',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle action buttons
    clients.openWindow(event.notification.data.url || '/');
  } else {
    // Default click - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'getQueue') {
    getQueue().then(queue => {
      event.ports[0].postMessage({ queue });
    });
  }
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});