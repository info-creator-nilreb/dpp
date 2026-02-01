/**
 * Unified Content Block Types
 * 
 * Abstrakte Contracts für Frontend-Komponenten, unabhängig von CMS-Implementation
 */

export type EditorialLayer = "spine" | "data" | "deep"
export type DensityLevel = "compact" | "normal" | "detailed"

export interface FieldValue {
  value: string | number | boolean | string[] | number[] | Record<string, unknown> | Record<string, unknown>[] | null
  type: string
  label: string
  key: string
}

export interface UnifiedContentBlock {
  // Core Identity
  id: string
  blockKey: string // TemplateBlock.id ODER BlockType.key
  displayName: string // TemplateBlock.name ODER BlockType.name
  order: number
  
  // Content Data (unified)
  content: {
    // Strukturierte Felder (aus Template-Fields ODER BlockType.data)
    fields: Record<string, FieldValue>
    // Wiederholbare Instanzen (aus RepeatableFieldGroup ODER BlockType.data[instances])
    instances?: Array<Record<string, FieldValue>>
  }
  
  // Presentation Metadata (abstrahiert)
  presentation: {
    layer: EditorialLayer // Aus TemplateBlock.order=0 ODER metadata.editorialLayer
    defaultCollapsed: boolean // Berechnet aus layer="data" ODER metadata.collapsedByDefault
    summary?: string // Aus metadata.summary ODER erste N Zeichen von content
    density: DensityLevel // Aus metadata.density ODER calculated
    allowedInEditorialSpine: boolean // Aus BlockType.category ODER TemplateBlock.order=0
  }
  
  // Supplier & Source Attribution (vorbereitet für Feature Branch)
  attribution?: {
    enabled: boolean
    mode?: "input" | "declaration"
    sourceId?: string
    sourceName?: string
  }
  
  // Version Info (für DPP-Versionierung)
  versionInfo?: {
    version: number
    createdAt: Date
  }
  
  // Feature Flags (für zukünftige Features)
  features?: {
    supportsStyling?: boolean
    requiresPublishing?: boolean
    exportFormats?: string[]
    regulatoryMapping?: Record<string, string>
  }
}
