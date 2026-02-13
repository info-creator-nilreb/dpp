/**
 * Content Adapter: Template-basierte Struktur → Unified Content Block
 * 
 * Transformiert aktuelle TemplateBlock-Struktur in Unified Contract
 */

import { UnifiedContentBlock, FieldValue, EditorialLayer } from './types'

// Template-Strukturen (aus Prisma Schema)
interface TemplateBlock {
  id: string
  name: string
  order: number
  fields: Array<{
    id: string
    label: string
    key: string
    type: string
    required: boolean
    config: any
    order: number
    isRepeatable?: boolean
  }>
}

interface DppContent {
  // DPP-Daten (aus verschiedenen Quellen)
  [key: string]: any
}

interface DppBlockSupplierConfig {
  enabled: boolean
  mode?: "input" | "declaration"
  allowedRoles?: string[]
}

interface DppMedia {
  id: string
  storageUrl: string
  fileType: string
  fileName?: string
  blockId?: string | null
  fieldId?: string | null
  fieldKey?: string | null
}

/** Dateiname ohne Extension als Anzeigename (z.B. "CE-Konformität.pdf" → "CE-Konformität") */
function displayNameFromFileName(fileName?: string): string | undefined {
  if (!fileName || typeof fileName !== 'string') return undefined
  const lastDot = fileName.lastIndexOf('.')
  const base = lastDot > 0 ? fileName.slice(0, lastDot) : fileName
  return base.trim() || undefined
}

/**
 * Extrahiert Field-Value aus DPP-Daten.
 * Bei Media-Feldern: nur Medien mit passendem blockId (und fieldKey/fieldId) zuordnen,
 * damit Bilder ausschließlich in dem Block erscheinen, in dem sie hochgeladen wurden.
 */
function extractFieldValue(
  field: TemplateBlock['fields'][0],
  dppContent: DppContent | null,
  media: DppMedia[] = [],
  blockId?: string
): FieldValue {
  // Versuche Wert aus DPP-Daten zu holen (basierend auf field.key)
  let value: FieldValue['value'] = null
  
  if (dppContent && field.key in dppContent) {
    value = dppContent[field.key]
  }
  
  // Für Media-Fields: Suche zugehörige Medien (blockId + fieldKey/fieldId aus Upload)
  if (field.type.startsWith('file-') || field.type === 'file') {
    const fieldMedia = media.filter(m => {
      const fid = (m as any).fieldId
      const fkey = (m as any).fieldKey ?? fid
      const matchesField = fid === field.id || fid === field.key || fkey === field.id || fkey === field.key
      if (!matchesField) return false
      // Medien mit blockId: nur diesem Block zuordnen
      if (blockId && (m.blockId != null && m.blockId !== '')) {
        return m.blockId === blockId
      }
      // Legacy-Medien ohne blockId: weiterhin per Feld zuordnen (Rückwärtskompatibilität)
      return true
    })
    if (fieldMedia.length > 0) {
      const items = fieldMedia.map((m: any) => ({
        url: m.storageUrl,
        displayName: (m.displayName && String(m.displayName).trim()) || displayNameFromFileName(m.fileName),
      }))
      value = items.length === 1 ? items[0] : items
    }
  }
  
  return {
    value: value ?? null,
    type: field.type,
    label: field.label,
    key: field.key,
    order: field.order
  }
}

/**
 * Generiert Zusammenfassung aus Block-Content
 */
export function generateSectionSummary(block: UnifiedContentBlock): string {
  const fieldCount = Object.keys(block.content.fields).length
  const imageCount = Object.values(block.content.fields).filter(
    f => f.type?.startsWith('file-image') || f.type === 'file-image'
  ).length
  const documentCount = Object.values(block.content.fields).filter(
    f => f.type === 'file-document' || f.type === 'file'
  ).length
  
  const parts: string[] = []
  
  if (fieldCount > 0) {
    parts.push(`${fieldCount} ${fieldCount === 1 ? 'Feld' : 'Felder'}`)
  }
  
  if (imageCount > 0) {
    parts.push(`${imageCount} ${imageCount === 1 ? 'Bild' : 'Bilder'}`)
  }
  
  if (documentCount > 0) {
    parts.push(`${documentCount} ${documentCount === 1 ? 'Dokument' : 'Dokumente'}`)
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Keine Daten'
}

/**
 * Transformiert TemplateBlock → UnifiedContentBlock
 */
export function adaptTemplateBlockToUnified(
  templateBlock: TemplateBlock,
  dppContent: DppContent | null,
  supplierConfig: DppBlockSupplierConfig | null = null,
  media: DppMedia[] = [],
  versionInfo?: { version: number; createdAt: Date }
): UnifiedContentBlock {
  // Berechne editorial layer basierend auf order
  const layer: EditorialLayer = 
    templateBlock.order === 0 ? "spine" : "data"
  
  // Extrahiere Content-Werte (blockId für korrekte Medien-Zuordnung pro Block)
  const fields: Record<string, FieldValue> = {}
  templateBlock.fields.forEach(field => {
    fields[field.key] = extractFieldValue(field, dppContent, media, templateBlock.id)
  })
  
  // Generiere Zusammenfassung
  const summary = generateSectionSummary({
    id: templateBlock.id,
    blockKey: templateBlock.id,
    displayName: templateBlock.name,
    order: templateBlock.order,
    content: { fields },
    presentation: {
      layer,
      defaultCollapsed: layer !== "spine",
      density: "normal",
      allowedInEditorialSpine: layer === "spine"
    }
  })
  
  return {
    id: templateBlock.id,
    blockKey: templateBlock.id,
    displayName: templateBlock.name,
    order: templateBlock.order,
    content: { fields },
    presentation: {
      layer,
      defaultCollapsed: layer !== "spine",
      summary,
      density: "normal",
      allowedInEditorialSpine: layer === "spine"
    },
    attribution: supplierConfig ? {
      enabled: supplierConfig.enabled,
      mode: supplierConfig.mode || "input",
      sourceId: supplierConfig.allowedRoles?.[0],
      sourceName: undefined // Wird später aus Supplier-Daten geladen
    } : undefined,
    versionInfo,
    features: {
      supportsStyling: false, // Template-basierte Struktur unterstützt noch kein Styling
      requiresPublishing: false
    }
  }
}

/**
 * Enrichiert Block mit Defaults für fehlende Metadaten
 */
export function enrichBlockWithDefaults(
  block: Partial<UnifiedContentBlock>
): UnifiedContentBlock {
  return {
    id: block.id || `block-${Date.now()}`,
    blockKey: block.blockKey || "unknown",
    displayName: block.displayName || "Unbenannter Block",
    order: block.order ?? 999,
    content: block.content || { fields: {} },
    presentation: {
      layer: block.presentation?.layer || 
        (block.order === 0 ? "spine" : "data"),
      defaultCollapsed: block.presentation?.defaultCollapsed ?? 
        (block.order !== 0),
      summary: block.presentation?.summary || 
        generateSectionSummary(block as UnifiedContentBlock),
      density: block.presentation?.density || "normal",
      allowedInEditorialSpine: block.presentation?.allowedInEditorialSpine ?? 
        (block.order === 0)
    },
    attribution: block.attribution,
    versionInfo: block.versionInfo,
    features: block.features
  }
}
