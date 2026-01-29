/**
 * DPP Transformer
 * 
 * Transformiert DPP + Template → Unified Content Blocks
 * Nutzt Content Adapter für Template-basierte Struktur
 */

import { prisma } from '@/lib/prisma'
import { adaptTemplateBlockToUnified, UnifiedContentBlock } from './template-adapter'
import { adaptCmsBlockToUnified } from './cms-adapter'
import { latestPublishedTemplate } from '@/lib/template-helpers'

interface TransformDppToUnifiedOptions {
  includeSupplierConfigs?: boolean
  includeVersionInfo?: boolean
}

/**
 * Transformiert DPP zu Unified Content Blocks
 */
export async function transformDppToUnified(
  dppId: string,
  options: TransformDppToUnifiedOptions = {}
): Promise<UnifiedContentBlock[]> {
  // Lade DPP mit allen benötigten Daten
  const dpp = await prisma.dpp.findUnique({
    where: { id: dppId },
    include: {
      organization: {
        select: {
          name: true,
          // logoUrl und website sind optional (können später hinzugefügt werden)
        },
      },
      media: {
        orderBy: { uploadedAt: 'asc' },
        take: 100,
      },
      versions: {
        where: {
          publicUrl: { not: null },
        },
        orderBy: { version: 'desc' },
        take: 1,
        select: {
          version: true,
          createdAt: true,
        },
      },
    },
  })
  
  if (!dpp) {
    throw new Error(`DPP mit ID ${dppId} nicht gefunden`)
  }
  
  // Lade Template
  const template = await latestPublishedTemplate(dpp.category)
  if (!template) {
    throw new Error(`Kein Template für Kategorie ${dpp.category} gefunden`)
  }
  
  // Lade Supplier-Configs (falls gewünscht)
  let supplierConfigs: Record<string, any> = {}
  if (options.includeSupplierConfigs) {
    const configs = await prisma.dppBlockSupplierConfig.findMany({
      where: { dppId },
    })
    configs.forEach(config => {
      supplierConfigs[config.blockId] = {
        enabled: config.enabled,
        mode: config.mode,
        allowedRoles: config.allowedRoles || [],
      }
    })
  }
  
  // Version-Info
  const versionInfo = options.includeVersionInfo && dpp.versions[0]
    ? {
        version: dpp.versions[0].version,
        createdAt: dpp.versions[0].createdAt,
      }
    : undefined
  
  // Transformiere DPP-Daten zu Record (für Field-Lookup)
  const dppContent: Record<string, any> = {
    name: dpp.name,
    description: dpp.description,
    sku: dpp.sku,
    gtin: dpp.gtin,
    brand: dpp.brand,
    countryOfOrigin: dpp.countryOfOrigin,
    materials: dpp.materials,
    materialSource: dpp.materialSource,
    careInstructions: dpp.careInstructions,
    isRepairable: dpp.isRepairable,
    sparePartsAvailable: dpp.sparePartsAvailable,
    lifespan: dpp.lifespan,
    conformityDeclaration: dpp.conformityDeclaration,
    disposalInfo: dpp.disposalInfo,
    takebackOffered: dpp.takebackOffered,
    takebackContact: dpp.takebackContact,
    secondLifeInfo: dpp.secondLifeInfo,
  }
  
  // Transformiere Media (fieldKey aus Schema; Template-Adapter matcht per field.id / field.key)
  const media = dpp.media.map(m => ({
    id: m.id,
    storageUrl: m.storageUrl,
    fileType: m.fileType,
    blockId: m.blockId || null,
    fieldId: (m as any).fieldKey || null,
    fieldKey: (m as any).fieldKey || null,
  }))
  
  // Lade DppContent für CMS-Blöcke
  // Wenn includeVersionInfo = false (Vorschau), lade auch Draft-Content
  const dppContentRecord = await prisma.dppContent.findFirst({
    where: {
      dppId,
      // Für Vorschau (includeVersionInfo = false): lade auch Draft-Content
      // Für veröffentlichte Versionen (includeVersionInfo = true): nur Published-Content
      isPublished: options.includeVersionInfo ? true : undefined
    },
    orderBy: { updatedAt: 'desc' }
  })
  
  // Filtere CMS-Blöcke: für Vorschau zeige auch Draft-Blöcke
  const cmsBlocks = dppContentRecord 
    ? ((dppContentRecord.blocks as any) || []).filter((b: any) => {
        // Nur CMS-Blöcke (nicht Template-Blöcke)
        if (!b.content || b.data || b.type === "template_block") return false
        // Für Vorschau: zeige alle Blöcke (draft + published)
        // Für veröffentlichte Versionen: nur published
        if (options.includeVersionInfo) {
          return b.status === "published"
        }
        return true // Vorschau: zeige alle
      })
    : []
  
  // Transformiere CMS-Blöcke zu Unified Content Blocks
  const cmsUnifiedBlocks = await Promise.all(
    cmsBlocks.map(async (block: any) => {
      const unified = await adaptCmsBlockToUnified(block, dppId)
      // Füge dppId als zusätzliche Property hinzu (für Multi-Question Poll Renderer)
      if (block.type === 'multi_question_poll') {
        (unified as any).dppId = dppId
      }
      return unified
    })
  )
  
  // Transformiere Template-Blocks zu Unified Content Blocks
  const templateUnifiedBlocks: UnifiedContentBlock[] = template.blocks.map(block => {
    const supplierConfig = supplierConfigs[block.id] || null
    
    return adaptTemplateBlockToUnified(
      {
        id: block.id,
        name: block.name,
        order: block.order,
        fields: block.fields.map(f => ({
          id: f.id,
          label: f.label,
          key: f.key,
          type: f.type,
          required: f.required,
          config: f.config ? (() => {
            try {
              return JSON.parse(f.config)
            } catch {
              return null
            }
          })() : null,
          order: f.order,
          isRepeatable: f.isRepeatable || false,
        })),
      },
      dppContent,
      supplierConfig,
      media,
      versionInfo
    )
  })
  
  // Kombiniere CMS- und Template-Blöcke, sortiert nach order
  const allBlocks = [...cmsUnifiedBlocks, ...templateUnifiedBlocks]
  return allBlocks.sort((a, b) => a.order - b.order)
}
