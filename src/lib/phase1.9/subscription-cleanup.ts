/**
 * Phase 1.9: Subscription State Cleanup & Validation
 * 
 * Detects and fixes invalid subscription states:
 * - trial status without planId
 * - legacy subscription states
 */

import { prisma } from "@/lib/prisma"
import { createAuditLog, ACTION_TYPES, ENTITY_TYPES, SOURCES } from "@/lib/audit/audit-service"

export interface InvalidSubscriptionState {
  organizationId: string
  organizationName: string
  subscriptionId: string
  currentStatus: string
  currentPlanId: string | null
  issue: string
}

/**
 * Detects organizations with invalid subscription states
 */
export async function detectInvalidSubscriptionStates(): Promise<InvalidSubscriptionState[]> {
  const invalidStates: InvalidSubscriptionState[] = []

  // Find subscriptions with trial status but no planId
  const trialWithoutPlan = await prisma.subscription.findMany({
    where: {
      OR: [
        { status: "trial" },
        { status: "trial_active" },
      ],
      subscriptionModelId: null,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  for (const sub of trialWithoutPlan) {
    invalidStates.push({
      organizationId: sub.organizationId,
      organizationName: sub.organization.name,
      subscriptionId: sub.id,
      currentStatus: sub.status,
      currentPlanId: sub.subscriptionModelId,
      issue: "trial_without_plan",
    })
  }

  return invalidStates
}

/**
 * Validates subscription state according to Phase 1.7 rules
 */
export function isValidSubscriptionState(
  subscription: {
    status: string
    subscriptionModelId: string | null
  } | null
): boolean {
  if (!subscription) {
    return true // No subscription = Free (valid)
  }

  const status = subscription.status.toLowerCase()

  // Trial status requires a planId
  if (status === "trial" || status === "trial_active") {
    return subscription.subscriptionModelId !== null
  }

  // Active status should have a planId (but we allow null for legacy compatibility)
  if (status === "active") {
    return true // Allow active without plan for now (legacy)
  }

  // Expired and canceled are always valid
  if (status === "expired" || status === "canceled" || status === "past_due") {
    return true
  }

  // Unknown status is invalid
  return false
}

/**
 * Cleanup strategy: Mark invalid trial subscriptions as expired
 * This makes the organization fall back to Free tier
 */
export async function cleanupInvalidSubscriptionState(
  subscriptionId: string,
  organizationId: string,
  reason: string,
  actorId?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get current state for audit
    const current = await tx.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!current) {
      throw new Error(`Subscription ${subscriptionId} not found`)
    }

    // Mark as expired (falls back to Free)
    await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "expired",
        // Keep subscriptionModelId for audit trail, but status is expired
      },
    })

    // Audit log
    await createAuditLog(
      {
        actorId: actorId || "SYSTEM",
        actorRole: actorId ? "SUPER_ADMIN" : "SYSTEM",
        organizationId,
        actionType: ACTION_TYPES.UPDATE,
        entityType: ENTITY_TYPES.SUBSCRIPTION,
        entityId: subscriptionId,
        fieldName: "status",
        oldValue: current.status,
        newValue: "expired",
        source: SOURCES.API,
        complianceRelevant: true,
        metadata: {
          cleanupReason: reason,
          wasInvalid: true,
          previousPlanId: current.subscriptionModelId,
        },
      },
      { adminUserId: actorId }
    )
  })
}

/**
 * Cleanup all invalid subscription states
 */
export async function cleanupAllInvalidSubscriptionStates(
  reason: string = "Phase 1.9: Legacy subscription state cleanup",
  actorId?: string
): Promise<{
  cleaned: number
  errors: Array<{ subscriptionId: string; error: string }>
}> {
  const invalidStates = await detectInvalidSubscriptionStates()
  const errors: Array<{ subscriptionId: string; error: string }> = []

  for (const state of invalidStates) {
    try {
      await cleanupInvalidSubscriptionState(
        state.subscriptionId,
        state.organizationId,
        reason,
        actorId
      )
    } catch (error: any) {
      errors.push({
        subscriptionId: state.subscriptionId,
        error: error.message || "Unknown error",
      })
    }
  }

  return {
    cleaned: invalidStates.length - errors.length,
    errors,
  }
}

/**
 * Validates that a subscription can be created/updated with the given state
 */
export function validateSubscriptionState(
  status: string,
  subscriptionModelId: string | null
): { valid: boolean; error?: string } {
  const normalizedStatus = status.toLowerCase()

  // Trial status requires a planId
  if (normalizedStatus === "trial" || normalizedStatus === "trial_active") {
    if (!subscriptionModelId) {
      return {
        valid: false,
        error: "Trial subscriptions require a subscriptionModelId (planId)",
      }
    }
  }

  return { valid: true }
}

