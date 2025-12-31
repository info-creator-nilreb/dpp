"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  message: string | null
  read: boolean
  createdAt: string
}

/**
 * Notifications Icon Component
 * 
 * Zeigt Glocken-Icon mit Badge für ungelesene Notifications
 */
export default function NotificationsIcon() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await fetch("/api/app/notifications?unread=true", {
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

    loadNotifications()
    
    // Poll alle 30 Sekunden für neue Notifications
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/app/notifications"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem",
        color: "#7A7A7A",
        textDecoration: "none",
        cursor: "pointer",
      }}
      aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {!loading && unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "0.25rem",
            right: "0.25rem",
            backgroundColor: "#E20074",
            color: "#FFFFFF",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            fontWeight: "600",
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  )
}

