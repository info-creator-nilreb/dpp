/**
 * Phase 1: Notification-System
 *
 * To-Do-Hinweise für User. Erweiterbar um Payload (targetRoute, actorRole, etc.)
 * Event-Typen und Defaults: @/lib/notifications/event-types
 */

import { prisma } from "@/lib/prisma"
import {
  getNotificationMessage,
  getNotificationTargetRoute,
  type NotificationEventPayload,
} from "@/lib/notifications/event-types"

export type NotificationType =
  | "join_request"
  | "invitation_accepted"
  | "subscription_warning"
  | "user_invited"
  | "user_removed"
  | "organization_updated"
  | "supplier_data_submitted"
  | string

/**
 * Erstellt eine Notification (legacy: nur type + reference).
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
      message: getNotificationMessage(type, null),
      targetRoute: getNotificationTargetRoute(type, null),
    },
  })

  return { notificationId: notification.id }
}

/**
 * Erstellt eine Notification mit vollem Payload (Deep-Link, Actor, Organisation).
 */
export async function createNotificationWithPayload(
  userId: string,
  type: string,
  payload?: NotificationEventPayload | null,
  referenceType?: string,
  referenceId?: string
): Promise<{ notificationId: string }> {
  const message = payload?.messageOverride ?? getNotificationMessage(type, null)
  const targetRoute = getNotificationTargetRoute(type, payload ?? undefined)

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      referenceType,
      referenceId,
      read: false,
      message,
      targetRoute,
      targetEntityId: payload?.targetEntityId ?? null,
      targetTab: payload?.targetTab ?? null,
      organisationId: payload?.organisationId ?? null,
      actorRole: payload?.actorRole ?? null,
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
 * Markiert Notification als gelesen (setzt readAt für Audit).
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
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

