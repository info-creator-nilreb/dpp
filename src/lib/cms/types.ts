/**
 * CMS TYPES
 * 
 * Type definitions for the block-based CMS system
 */

/**
 * Block Status
 */
export type BlockStatus = "draft" | "published"

/**
 * Block Type Keys
 */
export type BlockTypeKey = 
  | "storytelling"
  | "multi_question_poll"
  | "image_text"
  | "text"
  | "image"
  | "video"
  | "accordion"
  | "timeline"
  | "template_block" // Legacy block type from template system

/**
 * Block Definition
 */
export interface Block {
  id: string
  type: BlockTypeKey
  featureKey: string // References FEATURE_MANIFEST key
  order: number
  status: BlockStatus
  content: Record<string, any> // Schema-validated content
  createdAt?: string
  updatedAt?: string
}

/**
 * Styling Configuration
 */
export interface StylingConfig {
  logo?: {
    url: string
    alt?: string
    width?: number
    height?: number
  }
  colors: {
    primary: string // Hex color
    secondary?: string // Hex color
    accent?: string // Hex color
  }
  fonts?: {
    primary?: string // Font family from predefined list
    secondary?: string
  }
  spacing?: {
    blockSpacing?: number // px
    sectionPadding?: number // px
  }
}

/**
 * DPP Content Structure
 */
export interface DppContentData {
  blocks: Block[]
  styling?: StylingConfig
}

/**
 * Block Type Definition (from BlockType model)
 */
export interface BlockTypeDefinition {
  key: BlockTypeKey
  name: string
  description?: string
  category: "content" | "interaction" | "styling"
  featureKey: string
  configSchema: Record<string, any> // JSON Schema
  defaultConfig?: Record<string, any>
  supportsStyling: boolean
  requiresPublishing: boolean
}

/**
 * Block Content Schemas
 */
export interface StorytellingBlockContent {
  title: string
  description: string
  images?: Array<{
    url: string
    alt: string
    caption?: string
  }>
  sections?: Array<{
    heading: string
    text: string
    image?: string
  }>
}

export interface QuickPollBlockContent {
  question: string
  options: Array<{
    id: string
    label: string
  }>
  allowMultiple?: boolean
  showResults?: boolean
  completionMessage?: string
}

export interface MultiQuestionPollBlockContent {
  questions: Array<{
    question: string
    options: string[]
  }>
  completionMessage?: string
}

export interface ImageBlockContent {
  url: string | string[] // Einzelnes Bild oder Array von Bildern
  alt?: string // Alt-Text für alle Bilder (oder individuell)
  caption?: string // Caption für alle Bilder (oder individuell)
  alignment?: "left" | "center" | "right"
}

export interface ImageTextBlockContent {
  layout: "image_left" | "image_right" | "image_top" | "image_bottom"
  image: {
    url: string
    alt: string
    caption?: string
  }
  text: {
    heading?: string
    content: string
  }
}

/**
 * Resolved Theme (for frontend rendering)
 */
export interface ResolvedTheme {
  logo?: StylingConfig["logo"]
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  fonts: {
    primary: string
    secondary: string
  }
  spacing: {
    blockSpacing: number
    sectionPadding: number
  }
}

/**
 * Block Creation Request
 */
export interface CreateBlockRequest {
  type: BlockTypeKey
  content: Record<string, any>
  order?: number // Optional: will be appended if not provided
}

/**
 * Block Update Request
 */
export interface UpdateBlockRequest {
  content?: Record<string, any>
  order?: number
  status?: BlockStatus
}

/**
 * Block Reorder Request
 */
export interface ReorderBlocksRequest {
  blockIds: string[] // Ordered list of block IDs
}

/**
 * Styling Update Request
 */
export interface UpdateStylingRequest {
  logo?: StylingConfig["logo"]
  colors?: Partial<StylingConfig["colors"]>
  fonts?: Partial<StylingConfig["fonts"]>
  spacing?: Partial<StylingConfig["spacing"]>
}

