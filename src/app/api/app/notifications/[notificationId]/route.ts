/**
 * PUT /api/app/notifications/[notificationId]
 * 
 * Markiert eine Notification als gelesen
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { markNotificationAsRead } from "@/lib/phase1/notifications"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe ob Notification dem User gehört
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification) {
      return NextResponse.json(
        { error: "Notification nicht gefunden" },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    await markNotificationAsRead(notificationId)

    return NextResponse.json(
      { success: true, message: "Notification als gelesen markiert" },
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

