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
  multi_question_poll: "block_quick_poll", // TODO: Migrate to interaction_blocks after feature migration
  image_text: "block_image_text",
  text: "cms_access", // Basic text blocks are always available
  image: "cms_access",
  video: "cms_access",
  accordion: "cms_access",
  timeline: "cms_access",
  template_block: "cms_access" // Legacy block type from template system - treat as basic CMS block
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
    // For unknown block types, log a warning but allow them (for backward compatibility)
    // This handles legacy blocks that might still exist in the database
    console.warn(`[validateBlock] Unbekannter Block-Typ: ${block.type} - wird als gültig behandelt (Legacy)`)
    // Treat unknown block types as basic CMS blocks for backward compatibility
    // Skip further validation for unknown types
    return {
      valid: true, // Allow unknown block types for backward compatibility
      errors: [],
      warnings: [`Unbekannter Block-Typ: ${block.type} (Legacy-Block wird toleriert)`]
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
  // NOTE: Skip schema validation for draft blocks with empty content
  // This allows creating blocks first, then editing them
  const schema = blockSchemas[block.type]
  const isDraft = block.status === "draft"
  const isEmptyContent = !block.content || Object.keys(block.content).length === 0
  
  if (schema && block.status === "published") {
    // Only validate published blocks against schema strictly
    const schemaErrors = validateAgainstSchema(block.content, schema, false)
    if (schemaErrors.length > 0) {
      errors.push(...schemaErrors.map(e => `Block ${block.id}: ${e}`))
    }
  } else if (schema && isDraft && isEmptyContent) {
    // Skip validation for draft blocks with empty content (newly created blocks)
    // This allows creating blocks first, then editing them
  } else if (schema) {
    // Validate draft blocks leniently (allow empty values) if they have some content
    const schemaErrors = validateAgainstSchema(block.content, schema, true)
    if (schemaErrors.length > 0) {
      errors.push(...schemaErrors.map(e => `Block ${block.id}: ${e}`))
    }
  } else if (!schema) {
    warnings.push(`Kein Schema für Block-Typ ${block.type} gefunden`)
  }

  // 4. Validate block order (must be non-negative integer)
  if (typeof block.order !== "number" || block.order < 0 || !Number.isInteger(block.order)) {
    errors.push(`Block ${block.id}: Ungültiger order-Wert`)
  }

  // 5. Validate block status
  // Normalize status: if missing or invalid, default to "draft"
  const normalizedStatus = (block.status === "draft" || block.status === "published") 
    ? block.status 
    : "draft"
  
  // Only report error if status is explicitly set to an invalid value (not just missing)
  if (block.status !== undefined && block.status !== null && 
      block.status !== "draft" && block.status !== "published") {
    errors.push(`Block ${block.id}: Ungültiger Status "${block.status}"`)
  }
  
  // Update block with normalized status for validation
  block.status = normalizedStatus

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

  // Allow empty blocks array (all blocks deleted)
  if (blocks.length === 0) {
    return {
      valid: true,
      errors: [],
      warnings: undefined
    }
  }

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
    errors.push(`Doppelte Order-Werte gefunden: ${duplicateOrders.join(", ")}`)
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
      // Akzeptiere sowohl absolute als auch relative URLs
      const url = styling.logo.url.trim()
      if (url.length === 0) {
        errors.push("Logo URL darf nicht leer sein")
      } else {
        // Prüfe ob es eine absolute URL ist (http/https) oder eine relative URL (beginnt mit /)
        const isAbsoluteUrl = url.startsWith("http://") || url.startsWith("https://")
        const isRelativeUrl = url.startsWith("/")
        
        if (isAbsoluteUrl) {
          // Validiere absolute URLs
          try {
            new URL(url)
          } catch {
            errors.push("Ungültige Logo URL")
          }
        } else if (!isRelativeUrl) {
          // Wenn weder absolute noch relative URL, ist es ungültig
          errors.push("Logo URL muss eine absolute URL (http:// oder https://) oder eine relative URL (beginnt mit /) sein")
        }
        // Relative URLs (beginnt mit /) sind immer gültig
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
function validateAgainstSchema(data: any, schema: any, isDraft: boolean = false): string[] {
  const errors: string[] = []

  if (schema.type === "object") {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors.push("Muss ein Objekt sein")
      return errors
    }

    // Check required fields (skip for drafts if field is empty or missing)
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          // For drafts, missing required fields are allowed (block can be created empty)
          if (!isDraft) {
            errors.push(`Pflichtfeld fehlt: ${field}`)
          }
        } else {
          // For drafts, allow empty values for required fields
          const value = data[field]
          if (!isDraft && (value === null || value === undefined || 
              (typeof value === "string" && value.length === 0) ||
              (Array.isArray(value) && value.length === 0))) {
            errors.push(`Pflichtfeld ${field} darf nicht leer sein`)
          }
          // For drafts, even if field exists but is empty, allow it
        }
      }
    }

    // Check properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          const value = data[key]
          const propErrors = validateValue(value, propSchema as any, isDraft)
          if (propErrors.length > 0) {
            errors.push(...propErrors.map(e => `${key}: ${e}`))
          }
        }
      }
    }
  }

  return errors
}

function validateValue(value: any, schema: any, isDraft: boolean = false): string[] {
  const errors: string[] = []

  if (schema.type === "string") {
    if (typeof value !== "string") {
      errors.push("Muss ein String sein")
    } else {
      // Allow empty strings in draft blocks
      if (isDraft && value.length === 0) {
        return errors // Skip minLength validation for empty strings in drafts
      }
      if (schema.minLength && value.length > 0 && value.length < schema.minLength) {
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
      // For draft blocks, allow empty arrays (for newly created blocks)
      if (isDraft && value.length === 0) {
        // Allow empty arrays in drafts - user can add items later
        // Skip minItems check for drafts
        return errors
      }
      // For draft blocks, allow arrays with empty items (for adding new items)
      if (isDraft) {
        // Only check maxItems for drafts (skip minItems)
        if (schema.maxItems && value.length > schema.maxItems) {
          errors.push(`Darf maximal ${schema.maxItems} Elemente enthalten`)
        }
        // Validate non-empty items only
        if (schema.items) {
          for (let i = 0; i < value.length; i++) {
            const item = value[i]
            // Skip validation for empty items in drafts
            if (typeof item === "string" && item.length === 0) {
              continue
            }
            if (typeof item === "object" && item !== null) {
              // For objects, check if all required fields are empty
              const hasContent = Object.values(item).some(v => {
                if (typeof v === "string") return v.length > 0
                return v !== null && v !== undefined
              })
              if (!hasContent) {
                continue // Skip empty objects in drafts
              }
            }
            const itemErrors = validateValue(item, schema.items, true)
            if (itemErrors.length > 0) {
              errors.push(...itemErrors.map(e => `[${i}]: ${e}`))
            }
          }
        }
      } else {
        // For published blocks, validate strictly
        if (schema.minItems && value.length < schema.minItems) {
          errors.push(`Muss mindestens ${schema.minItems} Elemente enthalten`)
        }
        if (schema.maxItems && value.length > schema.maxItems) {
          errors.push(`Darf maximal ${schema.maxItems} Elemente enthalten`)
        }
        if (schema.items) {
          for (let i = 0; i < value.length; i++) {
            const itemErrors = validateValue(value[i], schema.items, false)
            if (itemErrors.length > 0) {
              errors.push(...itemErrors.map(e => `[${i}]: ${e}`))
            }
          }
        }
      }
    }
  } else if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push("Muss ein Objekt sein")
    } else {
      const objErrors = validateAgainstSchema(value, schema, isDraft)
      if (objErrors.length > 0) {
        errors.push(...objErrors)
      }
    }
  }

  return errors
}

/**
 * Resolves theme with defaults
 * 
 * @deprecated Use resolveTheme from "@/lib/cms/theme-resolver" instead
 * This function is kept for backward compatibility but should not be used in client components
 */
export function resolveTheme(styling: StylingConfig | undefined): StylingConfig {
  // Re-export from theme-resolver to maintain backward compatibility
  const { resolveTheme: resolveThemeFromResolver } = require("./theme-resolver")
  return resolveThemeFromResolver(styling)
}

