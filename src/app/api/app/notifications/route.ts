/**
 * Phase 1: Notifications API
 * 
 * GET /api/app/notifications - Liste aller Notifications
 * PUT /api/app/notifications - Alle als gelesen markieren
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getUserNotifications,
  getUnreadNotifications,
  countUnreadNotifications,
  markAllNotificationsAsRead,
} from "@/lib/phase1/notifications"

/**
 * GET /api/app/notifications
 * 
 * Holt alle Notifications des Users
 * Query: ?unread=true (nur ungelesene)
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"

    let notifications
    let unreadCount = 0

    if (unreadOnly) {
      notifications = await getUnreadNotifications(session.user.id)
    } else {
      notifications = await getUserNotifications(session.user.id)
      unreadCount = await countUnreadNotifications(session.user.id)
    }

    return NextResponse.json(
      {
        notifications,
        unreadCount: unreadOnly ? notifications.length : unreadCount,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[NOTIFICATIONS_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/notifications
 * 
 * Markiert alle Notifications als gelesen
 */
export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    await markAllNotificationsAsRead(session.user.id)

    return NextResponse.json(
      { success: true, message: "Alle Notifications als gelesen markiert" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[NOTIFICATIONS_PUT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

