"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import {
  getNotificationMessage,
  getNotificationTargetRoute,
  NOTIFICATIONS_PAGE_BEHAVIOR,
  NOTIFICATION_CLICK_BEHAVIOR,
  buildNotificationClickPath,
  type NotificationForUI,
} from "@/lib/notifications"

/** API returns Prisma shape; new fields optional until migration. */
type NotificationFromApi = NotificationForUI & {
  targetRoute?: string | null
  targetEntityId?: string | null
  targetTab?: string | null
  message?: string | null
}

function resolveMessage(n: NotificationFromApi): string {
  return getNotificationMessage(n.type, n.message ?? null)
}

function resolveClickRoute(n: NotificationFromApi): string {
  const route = n.targetRoute ?? getNotificationTargetRoute(n.type, null)
  return buildNotificationClickPath({
    primaryRoute: route,
    tab: n.targetTab ?? null,
    version: null,
    entityId: n.targetEntityId ?? null,
  })
}

/** Group key: "today" | "this_week" | "older" */
function getGroupKey(createdAt: string): "today" | "this_week" | "older" {
  const d = new Date(createdAt)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  if (d >= startOfToday) return "today"
  if (d >= startOfWeek) return "this_week"
  return "older"
}

const GROUP_LABELS: Record<string, string> = {
  today: "Heute",
  this_week: "Diese Woche",
  older: "Älter",
}

export default function NotificationsClient() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationFromApi[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const grouped = useMemo(() => {
    const order: ("today" | "this_week" | "older")[] = ["today", "this_week", "older"]
    const map = new Map<string, NotificationFromApi[]>()
    for (const key of order) map.set(key, [])
    for (const n of notifications) {
      const key = getGroupKey(n.createdAt)
      map.get(key)!.push(n)
    }
    return order.map((key) => ({ key, label: GROUP_LABELS[key], items: map.get(key)! }))
  }, [notifications])

  async function loadNotifications() {
    setLoading(true)
    try {
      const response = await fetch("/api/app/notifications", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  async function markAllAsRead() {
    setMarkingAllRead(true)
    try {
      const response = await fetch("/api/app/notifications", { method: "PUT" })
      if (response.ok) await loadNotifications()
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/app/notifications/${notificationId}`, { method: "PUT" })
      if (response.ok) await loadNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  async function handleNotificationClick(n: NotificationFromApi) {
    if (!NOTIFICATION_CLICK_BEHAVIOR.clickMarksAsRead) {
      router.push(resolveClickRoute(n))
      return
    }
    if (NOTIFICATION_CLICK_BEHAVIOR.order === "mark_then_navigate") {
      if (!n.read) {
        await markAsRead(n.id)
      }
      router.push(resolveClickRoute(n))
    } else {
      router.push(resolveClickRoute(n))
      if (!n.read) void markAsRead(n.id)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Benachrichtigungen werden geladen..." />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
          }}
        >
          ← Zur Übersicht
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
        }}>
          Benachrichtigungen
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAllRead}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "500",
              cursor: markingAllRead ? "not-allowed" : "pointer",
              opacity: markingAllRead ? 0.6 : 1,
            }}
          >
            {markingAllRead ? "Wird markiert..." : "Alle als gelesen markieren"}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          color: "#7A7A7A",
        }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Keine Benachrichtigungen</p>
          <p>{NOTIFICATIONS_PAGE_BEHAVIOR.emptyStateMessage}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {grouped.map(({ key, label, items }) =>
            items.length === 0 ? null : (
              <div key={key}>
                <h2 style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#7A7A7A",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}>
                  {label}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {items.map((notification) => {
                    const route = resolveClickRoute(notification)
                    const isClickable = route !== "/app/notifications" && route.length > 0
                    return (
                      <div
                        key={notification.id}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onClick={() => isClickable && handleNotificationClick(notification)}
                        onKeyDown={(e) => {
                          if (isClickable && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            handleNotificationClick(notification)
                          }
                        }}
                        style={{
                          padding: "1rem",
                          backgroundColor: notification.read ? "#FFFFFF" : "#F5F5F5",
                          border: "1px solid #CDCDCD",
                          borderRadius: "8px",
                          cursor: isClickable ? "pointer" : "default",
                          position: "relative",
                        }}
                      >
                        {!notification.read && (
                          <div
                            style={{
                              position: "absolute",
                              top: "1rem",
                              right: "1rem",
                              width: "8px",
                              height: "8px",
                              backgroundColor: "#24c598",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                        <p style={{
                          margin: 0,
                          color: "#0A0A0A",
                          fontSize: "0.95rem",
                          fontWeight: notification.read ? "400" : "500",
                        }}>
                          {resolveMessage(notification)}
                        </p>
                        <p style={{
                          margin: "0.5rem 0 0 0",
                          color: "#7A7A7A",
                          fontSize: "0.85rem",
                        }}>
                          {new Date(notification.createdAt).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
