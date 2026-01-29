/**
 * CMS Content Adapter
 * 
 * Transformiert CMS-Blöcke (aus DppContent) → Unified Content Blocks
 * CMS-Blöcke haben `content` statt `data` und `type` statt TemplateBlock-ID
 */

import { UnifiedContentBlock, FieldValue, EditorialLayer } from './types'
import { prisma } from '@/lib/prisma'

interface CmsBlock {
  id: string
  type: string // BlockType.key (z.B. "text_block", "image_gallery")
  order: number
  content?: Record<string, any> // CMS-Block Content
  data?: Record<string, any> // Template-Block Data (für Kompatibilität)
  config?: Record<string, any> // Block Config
}

/**
 * Transformiert CMS-Block → Unified Content Block
 */
export async function adaptCmsBlockToUnified(
  cmsBlock: CmsBlock,
  dppId: string
): Promise<UnifiedContentBlock> {
  // Lade BlockType für Metadaten
  const blockType = await prisma.blockType.findUnique({
    where: { key: cmsBlock.type }
  })
  
  // Bestimme editorial layer basierend auf BlockType.category
  const layer: EditorialLayer = 
    blockType?.category === 'content' && cmsBlock.order === 0 ? "spine" : "data"
  
  // Transformiere Content zu Fields (spezielle Behandlung für verschiedene Block-Typen)
  const fields: Record<string, FieldValue> = {}
  const content = cmsBlock.content || cmsBlock.data || {}
  
  // Spezielle Behandlung für verschiedene Block-Typen
  if (cmsBlock.type === 'text_block' || cmsBlock.type === 'text') {
    fields.text = {
      value: content.text || content.content || '',
      type: 'textarea',
      label: 'Text',
      key: 'text'
    }
  } else if (cmsBlock.type === 'quote_block' || cmsBlock.type === 'quote') {
    fields.quote = {
      value: content.quote || content.text || '',
      type: 'textarea',
      label: 'Zitat',
      key: 'quote'
    }
    if (content.author) {
      fields.author = {
        value: content.author,
        type: 'text',
        label: 'Autor',
        key: 'author'
      }
    }
  } else if (cmsBlock.type === 'image') {
    // Image Block: Einzelnes Bild oder Array von Bildern mit URL, Alt-Text, Caption und Alignment
    // Normalisiere url zu Array (für mehrere Bilder)
    const urlValue = content.url || ''
    const urlArray = Array.isArray(urlValue) ? urlValue : (urlValue ? [urlValue] : [])
    fields.url = {
      value: urlArray,
      type: 'file-image',
      label: 'Bild URL',
      key: 'url'
    }
    if (content.alt) {
      fields.alt = {
        value: content.alt,
        type: 'text',
        label: 'Alt-Text',
        key: 'alt'
      }
    }
    if (content.caption) {
      fields.caption = {
        value: content.caption,
        type: 'text',
        label: 'Bildunterschrift',
        key: 'caption'
      }
    }
    if (content.alignment) {
      fields.alignment = {
        value: content.alignment,
        type: 'text',
        label: 'Ausrichtung',
        key: 'alignment'
      }
    }
  } else if (cmsBlock.type === 'image_gallery' || cmsBlock.type === 'gallery') {
    fields.images = {
      value: content.images || content.imageUrls || [],
      type: 'file-image',
      label: 'Bilder',
      key: 'images'
    }
  } else if (cmsBlock.type === 'list_block' || cmsBlock.type === 'list') {
    fields.items = {
      value: content.items || content.list || [],
      type: 'text',
      label: 'Liste',
      key: 'items'
    }
    if (content.ordered !== undefined) {
      fields.ordered = {
        value: content.ordered,
        type: 'boolean',
        label: 'Nummeriert',
        key: 'ordered'
      }
    }
  } else if (cmsBlock.type === 'video_block' || cmsBlock.type === 'video') {
    fields.videoUrl = {
      value: content.videoUrl || content.url || '',
      type: 'url',
      label: 'Video URL',
      key: 'videoUrl'
    }
    if (content.poster) {
      fields.poster = {
        value: content.poster,
        type: 'file-image',
        label: 'Poster',
        key: 'poster'
      }
    }
  } else if (cmsBlock.type === 'multi_question_poll') {
    // Multi-Question Poll: Speichere Fragen und Completion Message
    // Immer setzen, auch wenn leer (für korrekte Transformation)
    fields.questions = {
      value: Array.isArray(content.questions) ? content.questions : [],
      type: 'array',
      label: 'Fragen',
      key: 'questions'
    }
    fields.completionMessage = {
      value: content.completionMessage || 'Vielen Dank für Ihre Teilnahme!',
      type: 'text',
      label: 'Abschlussnachricht',
      key: 'completionMessage'
    }
    // Speichere dppId für den Renderer
    fields.dppId = {
      value: dppId,
      type: 'text',
      label: 'DPP ID',
      key: 'dppId'
    }
  } else {
    // Generische Behandlung für andere Block-Typen
    Object.entries(content).forEach(([key, value]) => {
      fields[key] = {
        value: value as any,
        type: typeof value === 'string' ? 'text' : typeof value,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        key
      }
    })
  }
  
  // Generiere Zusammenfassung
  const fieldCount = Object.keys(fields).length
  const summary = fieldCount > 0 
    ? `${fieldCount} ${fieldCount === 1 ? 'Feld' : 'Felder'}`
    : 'Keine Daten verfügbar'
  
  // Bestimme displayName: Verwende benutzerdefinierten Titel (title, heading, name) falls vorhanden, sonst generischen BlockType-Namen
  let displayName = blockType?.name || cmsBlock.type
  if (content.title && typeof content.title === 'string' && content.title.trim().length > 0) {
    displayName = content.title
  } else if (content.heading && typeof content.heading === 'string' && content.heading.trim().length > 0) {
    displayName = content.heading
  } else if (content.name && typeof content.name === 'string' && content.name.trim().length > 0) {
    displayName = content.name
  }
  
  const unifiedBlock: UnifiedContentBlock = {
    id: cmsBlock.id,
    blockKey: cmsBlock.type,
    displayName,
    order: cmsBlock.order,
    content: { fields },
    presentation: {
      layer,
      defaultCollapsed: layer !== "spine",
      summary,
      density: "normal",
      allowedInEditorialSpine: layer === "spine"
    },
    features: {
      supportsStyling: blockType?.supportsStyling || false,
      requiresPublishing: blockType?.requiresPublishing || false
    }
  }
  
  // Füge dppId als zusätzliche Property hinzu (für Multi-Question Poll)
  if (cmsBlock.type === 'multi_question_poll') {
    (unifiedBlock as any).dppId = dppId
  }
  
  return unifiedBlock
}
