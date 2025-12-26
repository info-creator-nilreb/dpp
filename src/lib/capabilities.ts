/**
 * Capability System für Subscription & Trial
 * 
 * Dieses Modul implementiert die Capability-Resolution-Logik basierend auf:
 * - Subscription Plan (basic | pro | premium)
 * - Subscription Status (trial_active | active | past_due | canceled | expired)
 * - Feature Registry Einstellungen
 */

import { prisma } from "./prisma";

export type Plan = "basic" | "pro" | "premium";
export type SubscriptionStatus = 
  | "trial_active" 
  | "active" 
  | "past_due" 
  | "canceled" 
  | "expired";

export interface ResolvedCapabilities {
  cms_access: boolean;
  block_editor: boolean;
  storytelling_blocks: boolean;
  interaction_blocks: boolean;
  styling_controls: boolean;
  publishing: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  plan: Plan;
  status: SubscriptionStatus;
  trialExpiresAt: Date | null;
  trialStartedAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
}

/**
 * Plan-Hierarchie für Feature-Vergleiche
 */
const PLAN_HIERARCHY: Record<Plan, number> = {
  basic: 1,
  pro: 2,
  premium: 3,
};

/**
 * Plan-basierte Capabilities (ohne Status-Überprüfung)
 */
const PLAN_CAPABILITIES: Record<Plan, Partial<ResolvedCapabilities>> = {
  basic: {
    storytelling_blocks: false,
    interaction_blocks: false,
    styling_controls: false,
  },
  pro: {
    storytelling_blocks: true,
    interaction_blocks: false,
    styling_controls: true,
  },
  premium: {
    storytelling_blocks: true,
    interaction_blocks: true,
    styling_controls: true,
  },
};

/**
 * Prüft, ob eine Subscription im Trial-Status ist
 */
export function isTrial(subscription: Subscription): boolean {
  return subscription.status === "trial_active";
}

/**
 * Prüft, ob eine Subscription aktiv ist (nicht expired, nicht canceled)
 */
export function isActive(subscription: Subscription): boolean {
  return subscription.status === "active" || subscription.status === "trial_active";
}

/**
 * Prüft, ob Publishing Capability vorhanden ist
 */
export function hasPublishingCapability(subscription: Subscription): boolean {
  // Trial = premium plan + trial_active status
  const isTrialActive = isTrial(subscription);
  
  if (isTrialActive) {
    return false; // Publishing disabled during trial
  }
  
  // Publishing enabled for active subscriptions only
  return subscription.status === "active";
}

/**
 * Resolved Capabilities basierend auf Subscription
 * (ohne Feature Registry - das kommt später)
 */
export function resolveCapabilities(
  subscription: Subscription
): ResolvedCapabilities {
  const isTrialActive = isTrial(subscription);
  const isActiveStatus = subscription.status === "active";
  const isExpired = subscription.status === "expired";
  
  // Base capabilities based on subscription status
  const baseCapabilities: ResolvedCapabilities = {
    cms_access: isActiveStatus || isTrialActive, // Active or trial
    block_editor: isActiveStatus || isTrialActive,
    publishing: isActiveStatus && !isTrialActive, // Only active, not trial
    // Plan-based capabilities werden unten hinzugefügt
    storytelling_blocks: false,
    interaction_blocks: false,
    styling_controls: false,
  };
  
  // Plan-based capabilities
  const planCapabilities = PLAN_CAPABILITIES[subscription.plan];
  
  // Merge: base + plan
  const resolved: ResolvedCapabilities = {
    ...baseCapabilities,
    ...planCapabilities,
    // Publishing always false in trial (override plan capabilities)
    publishing: baseCapabilities.publishing && !isTrialActive,
  };
  
  // Expired subscriptions lose all capabilities except potentially read-only
  if (isExpired) {
    return {
      cms_access: false,
      block_editor: false,
      storytelling_blocks: false,
      interaction_blocks: false,
      styling_controls: false,
      publishing: false,
    };
  }
  
  // Past due: CMS access bleibt, aber kein Publishing
  if (subscription.status === "past_due") {
    return {
      ...resolved,
      publishing: false,
    };
  }
  
  return resolved;
}

/**
 * Resolved Capabilities mit Feature Registry Integration
 * 
 * Diese Funktion holt die Feature Registry Einträge und wendet
 * Overrides basierend auf den Feature Registry Regeln an.
 */
export async function resolveCapabilitiesWithRegistry(
  subscription: Subscription
): Promise<ResolvedCapabilities> {
  // Base resolution
  const baseCapabilities = resolveCapabilities(subscription);
  
  // Fetch feature registry entries
  const features = await prisma.featureRegistry.findMany({
    where: {
      enabled: true,
    },
  });
  
  // Apply feature registry overrides
  const overrides: Partial<ResolvedCapabilities> = {};
  
  for (const feature of features) {
    // Check if feature requires active subscription
    if (
      feature.requiresActiveSubscription &&
      subscription.status !== "active"
    ) {
      if (feature.capabilityKey) {
        (overrides as any)[feature.capabilityKey] = false;
      }
      continue;
    }
    
    // Check minimum plan
    const requiredLevel = PLAN_HIERARCHY[feature.minimumPlan as Plan];
    const currentLevel = PLAN_HIERARCHY[subscription.plan];
    
    if (currentLevel < requiredLevel) {
      if (feature.capabilityKey) {
        (overrides as any)[feature.capabilityKey] = false;
      }
      continue;
    }
    
    // Check requires publishing capability
    if (
      feature.requiresPublishingCapability &&
      !hasPublishingCapability(subscription)
    ) {
      if (feature.capabilityKey) {
        (overrides as any)[feature.capabilityKey] = false;
      }
      continue;
    }
    
    // Check trial visibility/usable flags
    if (isTrial(subscription)) {
      if (!feature.visibleInTrial && feature.capabilityKey) {
        (overrides as any)[feature.capabilityKey] = false;
      }
      if (!feature.usableInTrial && feature.capabilityKey) {
        // Feature ist sichtbar aber nicht nutzbar - für jetzt disabled
        (overrides as any)[feature.capabilityKey] = false;
      }
    }
  }
  
  // Merge base + overrides (overrides können nur deaktivieren, nicht aktivieren)
  return {
    ...baseCapabilities,
    ...overrides,
    // Publishing always false in trial (final check)
    publishing: baseCapabilities.publishing && !isTrial(subscription),
  };
}

/**
 * Holt Capabilities für eine Organization
 */
export async function getCapabilitiesForOrganization(
  organizationId: string
): Promise<ResolvedCapabilities> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });
  
  if (!subscription) {
    // No subscription = trial_active with premium plan (default for new orgs)
    const defaultSubscription: Subscription = {
      id: "",
      organizationId,
      plan: "premium",
      status: "trial_active",
      trialExpiresAt: null,
      trialStartedAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    };
    
    return resolveCapabilitiesWithRegistry(defaultSubscription);
  }
  
  const subscriptionTyped: Subscription = {
    id: subscription.id,
    organizationId: subscription.organizationId,
    plan: subscription.plan as Plan,
    status: subscription.status as SubscriptionStatus,
    trialExpiresAt: subscription.trialExpiresAt,
    trialStartedAt: subscription.trialStartedAt,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
  };
  
  return resolveCapabilitiesWithRegistry(subscriptionTyped);
}

/**
 * Utility: Prüft ob ein bestimmtes Capability vorhanden ist
 */
export async function hasCapability(
  organizationId: string,
  capability: keyof ResolvedCapabilities
): Promise<boolean> {
  const capabilities = await getCapabilitiesForOrganization(organizationId);
  return capabilities[capability];
}

/**
 * Utility: Berechnet verbleibende Trial-Tage
 */
export function getTrialDaysRemaining(subscription: Subscription): number | null {
  if (!isTrial(subscription) || !subscription.trialExpiresAt) {
    return null;
  }
  
  const now = new Date();
  const expiresAt = new Date(subscription.trialExpiresAt);
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

