import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react"
import { useNotifications } from "@/features/notifications/useNotifications"
import styles from "./NotificationBell.module.css"

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    })
  } catch {
    return value
  }
}

const NotificationBell = () => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
    pushState,
    requestPushPermission,
    errorMessage,
    refetch,
  } = useNotifications()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!open) return
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount)
  const pushMessage = useMemo(() => {
    switch (pushState) {
      case "enabled":
        return "Push ativo para avisar novas atribuicoes."
      case "blocked":
        return "Permita notificacoes no navegador para receber avisos."
      case "missing-key":
        return "Configure a VAPID public key no backend para ativar push."
      case "unsupported":
        return "Push nao suportado neste navegador."
      case "error":
        return "Falha ao registrar push. Tente novamente."
      default:
        return "Ative o push para ser avisado assim que novas OS forem atribuidas."
    }
  }, [pushState])

  const handleItemClick = (id: number, target?: string | null) => {
    markAsRead(id)
    if (target) {
      navigate(target)
      setOpen(false)
    }
  }

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label="Notificacoes"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <span className={styles.badge}>{badgeLabel}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div>
              <p className={styles.dropdownTitle}>Notificacoes</p>
              <p className={styles.dropdownSubtitle}>
                {unreadCount > 0 ? `${unreadCount} novas` : "Atualizado"}
              </p>
            </div>
            <button
              type="button"
              className={styles.markAllButton}
              onClick={() => markAllAsRead()}
              disabled={isMarkingAll || unreadCount === 0}
            >
              {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              <span>Marcar tudo</span>
            </button>
          </div>

          {pushState !== "enabled" && (
            <div className={styles.pushHint}>
              <div>
                <p className={styles.pushTitle}>Push</p>
                <p className={styles.pushCopy}>{pushMessage}</p>
              </div>
              {pushState !== "unsupported" && (
                <button
                  type="button"
                  className={styles.pushAction}
                  onClick={() => requestPushPermission()}
                >
                  Ativar
                </button>
              )}
            </div>
          )}

          <div className={styles.list}>
            {errorMessage ? (
              <div className={styles.empty}>
                <span>{errorMessage}</span>
                <button className={styles.retryButton} onClick={() => refetch()}>
                  Tentar novamente
                </button>
              </div>
            ) : isLoading ? (
              <div className={styles.empty}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Carregando notificacoes...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>
                <Inbox className="w-4 h-4" />
                <span>Nenhuma notificacao ate o momento.</span>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.item} ${!item.is_read ? styles.unread : ""}`}
                  onClick={() => handleItemClick(item.id, item.target_url)}
                >
                  <div className={styles.itemHeader}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    {!item.is_read && <span className={styles.unreadDot} aria-hidden />}
                  </div>
                  {item.body && <p className={styles.itemBody}>{item.body}</p>}
                  <p className={styles.itemMeta}>{formatDate(item.created_at)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
