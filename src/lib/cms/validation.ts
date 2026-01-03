/**
 * CMS VALIDATION
 * 
 * Validates blocks and styling based on:
 * - Feature capabilities
 * - JSON Schema validation
 * - Subscription tiers
 */

import { prisma } from "@/lib/prisma"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"
import { Block, StylingConfig, BlockTypeKey } from "./types"
import { blockSchemas, stylingConfigSchema, defaultStylingConfig } from "./schemas"
import { getFeatureDefinition } from "@/features/feature-manifest"

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Feature Key Mapping for Block Types
 */
export const BLOCK_TYPE_FEATURE_MAP: Record<BlockTypeKey, string> = {
  storytelling: "block_storytelling",
  quick_poll: "block_quick_poll",
  image_text: "block_image_text",
  text: "cms_access", // Basic text blocks are always available
  image: "cms_access",
  video: "cms_access",
  accordion: "cms_access",
  timeline: "cms_access"
}

/**
 * Validates a single block
 */
export async function validateBlock(
  block: Block,
  context: CapabilityContext
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Check if block type is valid
  const featureKey = BLOCK_TYPE_FEATURE_MAP[block.type]
  if (!featureKey) {
    return {
      valid: false,
      errors: [`Unbekannter Block-Typ: ${block.type}`]
    }
  }

  // 2. Check feature availability
  const hasBlockFeature = await hasFeature(featureKey, context)
  if (!hasBlockFeature) {
    const featureDef = getFeatureDefinition(featureKey)
    const planName = featureDef?.minimumPlan || "Premium"
    return {
      valid: false,
      errors: [
        `Block-Typ "${block.type}" ist nicht verfügbar. Upgrade auf ${planName} Plan erforderlich.`
      ]
    }
  }

  // 3. Validate block content against schema
  const schema = blockSchemas[block.type]
  if (schema) {
    const schemaErrors = validateAgainstSchema(block.content, schema)
    if (schemaErrors.length > 0) {
      errors.push(...schemaErrors.map(e => `Block ${block.id}: ${e}`))
    }
  } else {
    warnings.push(`Kein Schema für Block-Typ ${block.type} gefunden`)
  }

  // 4. Validate block order (must be non-negative integer)
  if (typeof block.order !== "number" || block.order < 0 || !Number.isInteger(block.order)) {
    errors.push(`Block ${block.id}: Ungültiger order-Wert`)
  }

  // 5. Validate block status
  if (block.status !== "draft" && block.status !== "published") {
    errors.push(`Block ${block.id}: Ungültiger Status`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validates all blocks in content
 */
export async function validateBlocks(
  blocks: Block[],
  context: CapabilityContext
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for duplicate IDs
  const blockIds = blocks.map(b => b.id)
  const duplicateIds = blockIds.filter((id, index) => blockIds.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    errors.push(`Doppelte Block-IDs gefunden: ${duplicateIds.join(", ")}`)
  }

  // Check for duplicate orders
  const orders = blocks.map(b => b.order)
  const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index)
  if (duplicateOrders.length > 0) {
    errors.push(`Doppelte Order-Werte gefunden`)
  }

  // Validate each block
  for (const block of blocks) {
    const result = await validateBlock(block, context)
    if (!result.valid) {
      errors.push(...result.errors)
    }
    if (result.warnings) {
      warnings.push(...result.warnings)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validates styling configuration
 */
export async function validateStyling(
  styling: StylingConfig,
  context: CapabilityContext
): Promise<ValidationResult> {
  const errors: string[] = []

  // Check if styling feature is available
  const hasStylingFeature = await hasFeature("cms_styling", context)
  if (!hasStylingFeature) {
    return {
      valid: false,
      errors: [
        "Styling ist nicht verfügbar. Upgrade auf Premium Plan erforderlich."
      ]
    }
  }

  // Validate colors
  if (styling.colors) {
    if (!styling.colors.primary || !/^#[0-9A-Fa-f]{6}$/.test(styling.colors.primary)) {
      errors.push("Ungültige Primary-Farbe (muss Hex-Format sein, z.B. #000000)")
    }
    if (styling.colors.secondary && !/^#[0-9A-Fa-f]{6}$/.test(styling.colors.secondary)) {
      errors.push("Ungültige Secondary-Farbe (muss Hex-Format sein)")
    }
    if (styling.colors.accent && !/^#[0-9A-Fa-f]{6}$/.test(styling.colors.accent)) {
      errors.push("Ungültige Accent-Farbe (muss Hex-Format sein)")
    }
  }

  // Validate fonts (if provided, must be from predefined list)
  const allowedFonts = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Source Sans Pro",
    "Raleway"
  ]

  if (styling.fonts?.primary && !allowedFonts.includes(styling.fonts.primary)) {
    errors.push(`Ungültige Primary-Schriftart. Erlaubt: ${allowedFonts.join(", ")}`)
  }
  if (styling.fonts?.secondary && !allowedFonts.includes(styling.fonts.secondary)) {
    errors.push(`Ungültige Secondary-Schriftart. Erlaubt: ${allowedFonts.join(", ")}`)
  }

  // Validate logo
  if (styling.logo) {
    if (!styling.logo.url) {
      errors.push("Logo URL ist erforderlich")
    } else {
      try {
        new URL(styling.logo.url)
      } catch {
        errors.push("Ungültige Logo URL")
      }
    }
    if (styling.logo.width && (styling.logo.width < 1 || styling.logo.width > 2000)) {
      errors.push("Logo-Breite muss zwischen 1 und 2000px liegen")
    }
    if (styling.logo.height && (styling.logo.height < 1 || styling.logo.height > 2000)) {
      errors.push("Logo-Höhe muss zwischen 1 und 2000px liegen")
    }
  }

  // Validate spacing
  if (styling.spacing) {
    if (styling.spacing.blockSpacing !== undefined) {
      if (styling.spacing.blockSpacing < 0 || styling.spacing.blockSpacing > 200) {
        errors.push("Block-Spacing muss zwischen 0 und 200px liegen")
      }
    }
    if (styling.spacing.sectionPadding !== undefined) {
      if (styling.spacing.sectionPadding < 0 || styling.spacing.sectionPadding > 200) {
        errors.push("Section-Padding muss zwischen 0 und 200px liegen")
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates complete DPP content
 */
export async function validateDppContent(
  blocks: Block[],
  styling: StylingConfig | undefined,
  context: CapabilityContext
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate blocks
  const blocksValidation = await validateBlocks(blocks, context)
  if (!blocksValidation.valid) {
    errors.push(...blocksValidation.errors)
  }
  if (blocksValidation.warnings) {
    warnings.push(...blocksValidation.warnings)
  }

  // Validate styling (if provided)
  if (styling) {
    const stylingValidation = await validateStyling(styling, context)
    if (!stylingValidation.valid) {
      errors.push(...stylingValidation.errors)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Simple JSON Schema validation (basic implementation)
 * For production, consider using ajv or similar library
 */
function validateAgainstSchema(data: any, schema: any): string[] {
  const errors: string[] = []

  if (schema.type === "object") {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors.push("Muss ein Objekt sein")
      return errors
    }

    // Check required fields
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`Pflichtfeld fehlt: ${field}`)
        }
      }
    }

    // Check properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          const value = data[key]
          const propErrors = validateValue(value, propSchema as any)
          if (propErrors.length > 0) {
            errors.push(...propErrors.map(e => `${key}: ${e}`))
          }
        }
      }
    }
  }

  return errors
}

function validateValue(value: any, schema: any): string[] {
  const errors: string[] = []

  if (schema.type === "string") {
    if (typeof value !== "string") {
      errors.push("Muss ein String sein")
    } else {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`Muss mindestens ${schema.minLength} Zeichen lang sein`)
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`Darf maximal ${schema.maxLength} Zeichen lang sein`)
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern)
        if (!regex.test(value)) {
          errors.push(`Muss dem Muster entsprechen: ${schema.pattern}`)
        }
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`Muss einer der folgenden Werte sein: ${schema.enum.join(", ")}`)
      }
    }
  } else if (schema.type === "number") {
    if (typeof value !== "number") {
      errors.push("Muss eine Zahl sein")
    } else {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`Muss mindestens ${schema.minimum} sein`)
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`Darf maximal ${schema.maximum} sein`)
      }
    }
  } else if (schema.type === "boolean") {
    if (typeof value !== "boolean") {
      errors.push("Muss ein Boolean sein")
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push("Muss ein Array sein")
    } else {
      if (schema.minItems && value.length < schema.minItems) {
        errors.push(`Muss mindestens ${schema.minItems} Elemente enthalten`)
      }
      if (schema.maxItems && value.length > schema.maxItems) {
        errors.push(`Darf maximal ${schema.maxItems} Elemente enthalten`)
      }
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemErrors = validateValue(value[i], schema.items)
          if (itemErrors.length > 0) {
            errors.push(...itemErrors.map(e => `[${i}]: ${e}`))
          }
        }
      }
    }
  } else if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push("Muss ein Objekt sein")
    } else {
      const objErrors = validateAgainstSchema(value, schema)
      if (objErrors.length > 0) {
        errors.push(...objErrors)
      }
    }
  }

  return errors
}

/**
 * Resolves theme with defaults
 */
export function resolveTheme(styling: StylingConfig | undefined): StylingConfig {
  return {
    colors: {
      primary: styling?.colors?.primary || defaultStylingConfig.colors.primary,
      secondary: styling?.colors?.secondary || defaultStylingConfig.colors.secondary,
      accent: styling?.colors?.accent || defaultStylingConfig.colors.accent
    },
    fonts: {
      primary: styling?.fonts?.primary || defaultStylingConfig.fonts.primary,
      secondary: styling?.fonts?.secondary || defaultStylingConfig.fonts.secondary
    },
    spacing: {
      blockSpacing: styling?.spacing?.blockSpacing ?? defaultStylingConfig.spacing.blockSpacing,
      sectionPadding: styling?.spacing?.sectionPadding ?? defaultStylingConfig.spacing.sectionPadding
    },
    logo: styling?.logo
  }
}

