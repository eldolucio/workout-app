const CACHE_NAME = 'workout-app-v1'
const STATIC_ASSETS = ['/', '/home']

// Instala e cacheia assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Exibe notificação push recebida
self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png', // Opcional
      image: data.image ?? undefined,
      tag: data.tag ?? 'workout-notification',
      renotify: true,
      requireInteraction: data.requireInteraction ?? false,
      vibrate: [200, 100, 200],
      data: { url: data.url ?? '/home', notificationId: data.notificationId },
      actions: data.actions ?? [],
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (err) {
    console.error('[SW] Erro ao processar push:', err)
  }
})

// Clique na notificação abre o app na URL correta
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/home'
  const notificationId = event.notification.data?.notificationId

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Marca notificação como aberta
      if (notificationId) {
        fetch('/api/notifications/opened', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notificationId }),
        }).catch(() => {})
      }

      // Se app já está aberto, foca nele e navega
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          if ('navigate' in client) client.navigate(url)
          return
        }
      }
      // Se app está fechado, abre numa nova janela
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
