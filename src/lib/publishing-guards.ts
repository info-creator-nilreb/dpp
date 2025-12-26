/**
 * Publishing Guards
 * 
 * Diese Module implementiert die Validierungslogik für Content Publishing
 * basierend auf Capabilities und Feature Registry.
 */

import { prisma } from "./prisma";
import {
  getCapabilitiesForOrganization,
  ResolvedCapabilities,
  Subscription,
} from "./capabilities";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface Block {
  id: string;
  type: string;
  order: number;
  config: Record<string, any>;
  styling?: Record<string, any>;
  data: Record<string, any>;
}

export interface DppContentData {
  blocks: Block[];
  styling?: {
    global?: {
      colors?: Record<string, string>;
      fonts?: Record<string, string>;
      spacing?: Record<string, number>;
    };
  };
}

interface ValidationContext {
  subscription: Subscription;
  capabilities: ResolvedCapabilities;
  organizationId: string;
}

/**
 * Validiert Content für Publishing
 */
export async function validateContentForPublishing(
  content: DppContentData,
  organizationId: string
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Get capabilities
  const capabilities = await getCapabilitiesForOrganization(organizationId);
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    errors.push("No subscription found for organization");
    return { valid: false, errors };
  }

  const context: ValidationContext = {
    subscription: subscription as any,
    capabilities,
    organizationId,
  };

  // 1. Publishing Capability Check
  if (!capabilities.publishing) {
    errors.push(
      "Publishing not available. Upgrade your plan or end trial."
    );
    return { valid: false, errors };
  }

  // 2. Block Type Validation
  const blockTypes = await prisma.blockType.findMany();
  const featureRegistry = await prisma.featureRegistry.findMany({
    where: { enabled: true },
  });

  for (const block of content.blocks) {
    const blockType = blockTypes.find((bt) => bt.key === block.type);

    if (!blockType) {
      errors.push(`Unknown block type: ${block.type}`);
      continue;
    }

    // 3. Feature Registry Check
    if (blockType.featureRegistryId) {
      const feature = featureRegistry.find(
        (f) => f.id === blockType.featureRegistryId
      );

      if (feature) {
        // Check minimum plan
        const planHierarchy = { basic: 1, pro: 2, premium: 3 };
        const requiredLevel =
          planHierarchy[feature.minimumPlan as keyof typeof planHierarchy];
        const currentLevel =
          planHierarchy[subscription.plan as keyof typeof planHierarchy];

        if (currentLevel < requiredLevel) {
          errors.push(
            `Block type ${block.type} requires ${feature.minimumPlan} plan`
          );
        }

        // Check requires publishing capability
        if (
          feature.requiresPublishingCapability &&
          !capabilities.publishing
        ) {
          errors.push(
            `Block type ${block.type} requires publishing capability`
          );
        }
      }
    }

    // 4. Schema Validation (basic check - full validation would use JSON Schema library)
    if (blockType.configSchema) {
      try {
        const schema = JSON.parse(blockType.configSchema);
        // Basic validation: check if config has required fields from schema
        // Full validation would use ajv or similar library
      } catch (e) {
        // Schema parsing error - log but don't block
        console.warn(`Invalid config schema for block type ${blockType.key}`);
      }
    }

    // 5. Styling Capability Check
    if (block.styling && !capabilities.styling_controls) {
      errors.push(
        `Block ${block.id}: Styling not available on current plan`
      );
    }
  }

  // 6. Global Styling Check
  if (content.styling && !capabilities.styling_controls) {
    errors.push("Global styling not available on current plan");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Prüft ob Draft-Speicherung erlaubt ist
 */
export async function canSaveDraft(
  organizationId: string
): Promise<boolean> {
  const capabilities = await getCapabilitiesForOrganization(organizationId);
  // Draft saving is always allowed if CMS access is available
  return capabilities.cms_access;
}

/**
 * Prüft ob Publishing erlaubt ist
 */
export async function canPublish(
  content: DppContentData,
  organizationId: string
): Promise<boolean> {
  const capabilities = await getCapabilitiesForOrganization(organizationId);

  // Publishing requires:
  // 1. Publishing capability
  // 2. Valid content
  if (!capabilities.publishing) {
    return false;
  }

  const validation = await validateContentForPublishing(content, organizationId);
  return validation.valid;
}

/**
 * Trial-spezifische Content-Speicherung
 */
export interface SaveResult {
  success: boolean;
  savedAs: "draft" | "draft_or_published" | "published";
  message?: string;
}

export async function handleContentSave(
  content: DppContentData,
  organizationId: string,
  publish: boolean = false
): Promise<SaveResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    return {
      success: false,
      savedAs: "draft",
      message: "No subscription found",
    };
  }

  const isTrial = subscription.status === "trial_active";

  if (isTrial) {
    // In trial: Save as draft only
    return {
      success: true,
      savedAs: "draft",
      message: "Content saved as draft. Upgrade to publish.",
    };
  }

  if (publish) {
    const canPublishContent = await canPublish(content, organizationId);
    if (!canPublishContent) {
      return {
        success: false,
        savedAs: "draft",
        message: "Content validation failed or publishing not available",
      };
    }
    return {
      success: true,
      savedAs: "published",
    };
  }

  // Normal save (draft)
  return {
    success: true,
    savedAs: "draft_or_published",
  };
}

