# Notification System

Single source of truth for **event types**, **payloads**, and **bell/click behavior**.

## PART 1: Event Types

- **Enums:** `NotificationCategory`, `NotificationPriority`, `NotificationActorRole`
- **Payload:** `NotificationEventPayload` (targetRoute, targetEntityId, targetTab, organisationId, actorRole, messageOverride)
- **Definitions:** `NOTIFICATION_EVENT_DEFINITIONS` – key, defaultMessageTemplate, priority, category, defaultTargetRoute
- **Minimum 12 events** in 5 categories: Collaboration & Roles, DPP Lifecycle, Compliance & Audit, System & Imports, Business & Limits

Use `getNotificationMessage(type, messageOverride)` and `getNotificationTargetRoute(type, payload)` for resolution. Create via `createNotificationWithPayload()` in `@/lib/phase1/notifications`.

## PART 2: Bell & Click Behavior

- **Visiting `/app/notifications`:** Does **not** auto-mark as read (explicit user action only).
- **Sorting:** Newest first (createdAt desc).
- **Grouping:** Optional "Heute" / "Diese Woche" / "Älter".
- **Single notification click:** Marks as read first, then navigates to `targetRoute` (order: mark_then_navigate).
- **Mark all as read:** No confirmation; immediate.

Data model: `readAt`, `targetRoute`, `targetEntityId`, `targetTab`, `organisationId`, `actorRole`, `message` (see Prisma `Notification`).
