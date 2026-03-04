/**
 * DPP Schema für das Frontend
 *
 * Entspricht dem aktuellen Prisma-Modell und den API-Responses
 * (GET /api/app/dpps, GET /api/app/dpp/[dppId], Editor, Listen).
 */

// ============== Enums / Literals ==============

/** DPP-Status (Prisma default: DRAFT) */
export type DppStatus = "DRAFT" | "PUBLISHED" | "DEPRECATED"

/** Produktkategorie (Filter: TEXTILE | FURNITURE | OTHER) */
export type DppCategory = "TEXTILE" | "FURNITURE" | "OTHER"

// ============== Media ==============

export interface DppMedia {
  id: string
  dppId: string
  fileName: string
  fileType: string
  fileSize: number
  storageUrl: string
  uploadedAt: string // ISO-Date von API
  sortOrder?: number
  displayName?: string | null
  role?: string | null
  blockId?: string | null
  fieldId?: string | null
  fieldKey?: string | null
}

// ============== DPP (Vollständig – Editor / GET /api/app/dpp/[dppId]) ==============

export interface Dpp {
  id: string
  name: string
  description: string | null
  category: string
  sku: string | null
  gtin: string | null
  brand: string | null
  countryOfOrigin: string | null
  materials: string | null
  materialSource: string | null
  careInstructions: string | null
  isRepairable: string | null
  sparePartsAvailable: string | null
  lifespan: string | null
  conformityDeclaration: string | null
  disposalInfo: string | null
  takebackOffered: string | null
  takebackContact: string | null
  secondLifeInfo: string | null
  status: string
  supersedesDppId?: string | null
  organizationId: string
  templateId?: string | null
  templateVersionId?: string | null
  createdAt: string
  updatedAt: string
  organization: {
    id: string
    name: string
    defaultStyling?: unknown
  }
  media: DppMedia[]
  content?: DppContentEntry[]
}

/** Ein Eintrag aus DppContent (Draft), wie von der API geliefert */
export interface DppContentEntry {
  id: string
  dppId: string
  versionId: string | null
  isPublished: boolean
  blocks: unknown // Array von Block-Objekten (template_block + CMS-Blöcke)
  styling?: StylingConfig
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

// ============== DPP-Liste (GET /api/app/dpps) ==============

export interface DppListItem {
  id: string
  name: string
  description: string | null
  category: string
  status: string
  updatedAt: string
  organizationName: string
  mediaCount: number
  latestVersion?: {
    version: number
    createdAt: string
    createdBy: string
    hasQrCode: boolean
  } | null
}

export interface DppListResponse {
  dpps: DppListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============== DPP-Detail-Response (GET /api/app/dpp/[dppId]) ==============

export interface DppDetailResponse {
  dpp: Dpp
  fieldValues: Record<string, string | string[]>
  fieldInstances: Record<
    string,
    Array<{
      instanceId: string
      values: Record<string, string | string[]>
    }>
  >
  hasDraftChanges: boolean
}

// ============== Content / CMS (aus src/lib/cms/types.ts) ==============

export type BlockStatus = "draft" | "published"

export type BlockTypeKey =
  | "storytelling"
  | "multi_question_poll"
  | "image_text"
  | "text"
  | "image"
  | "video"
  | "accordion"
  | "timeline"
  | "social_links"
  | "template_block"

export interface Block {
  id: string
  type: BlockTypeKey
  featureKey: string
  order: number
  status: BlockStatus
  content: Record<string, unknown>
  data?: Record<string, unknown> // Template-basierte Blöcke
  createdAt?: string
  updatedAt?: string
}

export interface StylingConfig {
  logo?: {
    url: string
    alt?: string
    width?: number
    height?: number
  }
  colors: {
    primary: string
    secondary?: string
    accent?: string
  }
  fonts?: {
    primary?: string
    secondary?: string
  }
  spacing?: {
    blockSpacing?: number
    sectionPadding?: number
  }
}

export interface DppContentData {
  blocks: Block[]
  styling?: StylingConfig
}
