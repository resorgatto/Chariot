/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core"
import { precacheAndRoute } from "workbox-precaching"

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<import("workbox-build").ManifestEntry>
}

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST || [])

self.addEventListener("push", (event: PushEvent) => {
  const dataText = event.data?.text() || "{}"
  let payload: { title?: string; body?: string; url?: string; tag?: string } = {}

  try {
    payload = JSON.parse(dataText)
  } catch {
    payload = { body: dataText }
  }

  const title = payload.title || "Nova notificacao"
  const options: NotificationOptions = {
    body: payload.body || "",
    icon: "/logo1.png",
    badge: "/logo1.png",
    tag: payload.tag || "chariot-push",
    data: {
      url: payload.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url || "/"
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url)
        const targetPath = new URL(targetUrl, self.location.origin).pathname
        if (clientUrl.pathname === targetPath) {
          client.focus()
          return client.navigate(targetUrl)
        }
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
