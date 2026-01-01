/**
 * Phase 1: Notification-System
 * 
 * To-Do-Hinweise für User
 */

import { prisma } from "@/lib/prisma"

export type NotificationType =
  | "join_request"
  | "invitation_accepted"
  | "subscription_warning"
  | "user_invited"
  | "user_removed"
  | "organization_updated"
  | "supplier_data_submitted"

/**
 * Erstellt eine Notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  referenceType?: string,
  referenceId?: string
): Promise<{ notificationId: string }> {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      referenceType,
      referenceId,
      read: false,
    },
  })

  return { notificationId: notification.id }
}

/**
 * Erstellt Notifications für alle ORG_ADMINs einer Organisation
 */
export async function notifyOrgAdmins(
  organizationId: string,
  type: NotificationType,
  referenceType?: string,
  referenceId?: string
): Promise<void> {
  // Hole alle ORG_ADMINs der Organisation
  const admins = await prisma.membership.findMany({
    where: {
      organizationId,
      role: "ORG_ADMIN",
    },
    select: { userId: true },
  })

  // Erstelle Notifications für alle Admins
  await Promise.all(
    admins.map((admin) =>
      createNotification(admin.userId, type, referenceType, referenceId)
    )
  )
}

/**
 * Holt alle Notifications eines Users
 */
export async function getUserNotifications(userId: string, limit = 50) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

/**
 * Holt ungelesene Notifications eines Users
 */
export async function getUnreadNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: {
      userId,
      read: false,
    },
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Zählt ungelesene Notifications
 */
export async function countUnreadNotifications(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  })
}

/**
 * Markiert Notification als gelesen
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

/**
 * Markiert alle Notifications eines Users als gelesen
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  })
}

