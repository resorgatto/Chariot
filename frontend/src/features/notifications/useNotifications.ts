import { useCallback, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  UserNotification,
  fetchNotifications,
  getPushPublicKey,
  markAllNotificationsRead,
  markNotificationRead,
  savePushSubscription,
} from "@/lib/api"
import { urlBase64ToUint8Array } from "@/lib/utils"

type PushState = "idle" | "enabled" | "blocked" | "unsupported" | "missing-key" | "error"

const NOTIFICATION_QUERY_KEY = ["notifications"]

const hasAuthTokens = () => {
  if (typeof window === "undefined") return false
  return Boolean(localStorage.getItem("access_token") || localStorage.getItem("auth") === "true")
}

export const useNotifications = () => {
  const [pushState, setPushState] = useState<PushState>("idle")
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery<UserNotification[]>({
    queryKey: NOTIFICATION_QUERY_KEY,
    queryFn: fetchNotifications,
    enabled: hasAuthTokens(),
    refetchInterval: 30000,
  })

  const notificationList = useMemo(
    () => (Array.isArray(notificationsQuery.data) ? notificationsQuery.data : []),
    [notificationsQuery.data],
  )

  const unreadCount = useMemo(
    () => notificationList.filter((n) => !n.is_read).length,
    [notificationList],
  )

  const markOneMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY }),
  })

  const subscribeToPush = useCallback(
    async (promptUser: boolean) => {
      if (typeof window === "undefined") return
      const hasSupport =
        "Notification" in window && "serviceWorker" in navigator && "PushManager" in window
      if (!hasSupport) {
        setPushState("unsupported")
        return
      }

      if (!hasAuthTokens()) return

      const permission = Notification.permission
      if (permission === "denied") {
        setPushState("blocked")
        return
      }
      if (permission === "default" && !promptUser) {
        return
      }

      const permissionResult =
        permission === "granted" ? "granted" : await Notification.requestPermission()
      if (permissionResult !== "granted") {
        setPushState(permissionResult === "denied" ? "blocked" : "idle")
        return
      }

      try {
        let key = publicKey
        if (!key) {
          const { public_key } = await getPushPublicKey()
          key = public_key || null
          setPublicKey(key)
        }

        if (!key) {
          setPushState("missing-key")
          return
        }

        const registration = await navigator.serviceWorker.ready
        const existing = await registration.pushManager.getSubscription()
        const subscription =
          existing ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          }))

        await savePushSubscription(subscription)
        setPushState("enabled")
      } catch (err) {
        console.error("Falha ao registrar push", err)
        setPushState("error")
      }
    },
    [publicKey],
  )

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      subscribeToPush(false)
    }
  }, [subscribeToPush])

  const errorMessage =
    notificationsQuery.error instanceof Error
      ? notificationsQuery.error.message
      : notificationsQuery.error
      ? "Erro ao carregar notificacoes."
      : ""

  return {
    notifications: notificationList,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    errorMessage,
    refetch: notificationsQuery.refetch,
    markAsRead: (id: number) => markOneMutation.mutate(id),
    markAllAsRead: () => markAllMutation.mutate(),
    isMarkingAll: markAllMutation.isPending,
    pushState,
    requestPushPermission: () => subscribeToPush(true),
  }
}
