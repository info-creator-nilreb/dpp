"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface Notification {
  id: string
  type: string
  referenceType: string | null
  referenceId: string | null
  message: string | null
  read: boolean
  createdAt: string
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    try {
      const response = await fetch("/api/app/notifications", {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
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
      const response = await fetch("/api/app/notifications", {
        method: "PUT",
      })
      if (response.ok) {
        await loadNotifications()
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/app/notifications/${notificationId}`, {
        method: "PUT",
      })
      if (response.ok) {
        await loadNotifications()
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  function getNotificationMessage(notification: Notification): string {
    if (notification.message) {
      return notification.message
    }

    switch (notification.type) {
      case "join_request":
        return "Eine neue Beitrittsanfrage wurde gestellt"
      case "invitation_accepted":
        return "Eine Einladung wurde akzeptiert"
      case "subscription_warning":
        return "Ihr Abonnement läuft bald ab"
      default:
        return "Neue Benachrichtigung"
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
          <p>Sie haben derzeit keine Benachrichtigungen.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.read && markAsRead(notification.id)}
              style={{
                padding: "1rem",
                backgroundColor: notification.read ? "#FFFFFF" : "#F5F5F5",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                cursor: notification.read ? "default" : "pointer",
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
                {getNotificationMessage(notification)}
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
          ))}
        </div>
      )}
    </div>
  )
}

