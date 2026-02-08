/**
 * DPP Transformer
 * 
 * Transformiert DPP + Template → Unified Content Blocks
 * Nutzt Content Adapter für Template-basierte Struktur
 */

import { prisma } from '@/lib/prisma'
import { UnifiedContentBlock } from './types'
import { adaptTemplateBlockToUnified } from './template-adapter'
import { adaptCmsBlockToUnified } from './cms-adapter'
import { latestPublishedTemplate } from '@/lib/template-helpers'

interface TransformDppToUnifiedOptions {
  includeSupplierConfigs?: boolean
  includeVersionInfo?: boolean
  /** Wenn gesetzt: Öffentliche Ansicht einer konkreten Version – Daten aus Version-Snapshot, nicht aus aktuellem Entwurf */
  versionNumber?: number
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
  
  // Bei öffentlicher Ansicht einer konkreten Version: Daten aus Version-Snapshot laden
  type VersionRow = {
    id: string
    version: number
    createdAt: Date
    name: string
    description: string | null
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
  }
  let versionRow: VersionRow | null = null
  if (options.versionNumber != null) {
    versionRow = await prisma.dppVersion.findFirst({
      where: { dppId, version: options.versionNumber },
      select: {
        id: true,
        version: true,
        createdAt: true,
        name: true,
        description: true,
        sku: true,
        gtin: true,
        brand: true,
        countryOfOrigin: true,
        materials: true,
        materialSource: true,
        careInstructions: true,
        isRepairable: true,
        sparePartsAvailable: true,
        lifespan: true,
        conformityDeclaration: true,
        disposalInfo: true,
        takebackOffered: true,
        takebackContact: true,
        secondLifeInfo: true,
      },
    }) as VersionRow | null
  }

  // Version-Info (version/createdAt getrennt ermitteln, da Prisma versions[0] sonst als never inferiert)
  type VersionInfoItem = { version: number; createdAt: Date }
  const hasVersion = Array.isArray(dpp.versions) && dpp.versions.length > 0
  let versionNum: number | undefined
  let versionDate: Date | undefined
  if (versionRow) {
    versionNum = versionRow.version
    versionDate = versionRow.createdAt
  } else if (hasVersion) {
    const v = dpp.versions[0] as unknown as VersionInfoItem
    versionNum = v.version
    versionDate = v.createdAt
  }
  const versionInfo =
    options.includeVersionInfo && versionNum != null && versionDate != null
      ? { version: versionNum, createdAt: versionDate }
      : undefined

  // Transformiere DPP-Daten zu Record (für Field-Lookup)
  // Bei Version-Anzeige: Snapshot-Daten der Version, sonst aktueller Entwurf (dpp)
  const dataSource = versionRow ?? dpp
  const dppContent: Record<string, any> = {
    name: dataSource.name,
    description: dataSource.description ?? null,
    sku: dataSource.sku ?? null,
    gtin: dataSource.gtin ?? null,
    brand: dataSource.brand ?? null,
    countryOfOrigin: dataSource.countryOfOrigin ?? null,
    materials: dataSource.materials ?? null,
    materialSource: dataSource.materialSource ?? null,
    careInstructions: dataSource.careInstructions ?? null,
    isRepairable: dataSource.isRepairable ?? null,
    sparePartsAvailable: dataSource.sparePartsAvailable ?? null,
    lifespan: dataSource.lifespan ?? null,
    conformityDeclaration: dataSource.conformityDeclaration ?? null,
    disposalInfo: dataSource.disposalInfo ?? null,
    takebackOffered: dataSource.takebackOffered ?? null,
    takebackContact: dataSource.takebackContact ?? null,
    secondLifeInfo: dataSource.secondLifeInfo ?? null,
  }

  // Transformiere Media (fieldKey aus Schema; Template-Adapter matcht per field.id / field.key)
  // Bei öffentlicher Version werden Medien von DppPublicView aus version.media übergeben – hier dpp.media für Vorschau
  const media = dpp.media.map(m => ({
    id: m.id,
    storageUrl: m.storageUrl,
    fileType: m.fileType,
    blockId: m.blockId || null,
    fieldId: (m as any).fieldKey || null,
    fieldKey: (m as any).fieldKey || null,
  }))

  // Lade DppContent für CMS-Blöcke
  // Bei versionNumber: Content-Snapshot dieser Version (versionId); sonst Draft oder isPublished
  const dppContentRecord = versionRow
    ? await prisma.dppContent.findFirst({
        where: { dppId, versionId: versionRow.id, isPublished: true },
        orderBy: { updatedAt: 'desc' },
      })
    : await prisma.dppContent.findFirst({
        where: {
          dppId,
          isPublished: options.includeVersionInfo ? true : undefined,
        },
        orderBy: { updatedAt: 'desc' },
      })

  // Filtere CMS-Blöcke: für Vorschau zeige auch Draft-Blöcke
  const cmsBlocks = dppContentRecord
    ? ((dppContentRecord.blocks as any) || []).filter((b: any) => {
        if (!b.content || b.data || b.type === "template_block") return false
        if (options.includeVersionInfo || versionRow) {
          return b.status === "published"
        }
        return true
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
