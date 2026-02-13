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

  // Media per Raw-SQL laden (displayName wird von Prisma Include ggf. nicht geliefert)
  const mediaRows = await prisma.$queryRaw<
    Array<{ id: string; storageUrl: string; fileType: string; fileName: string; displayName: string | null; blockId: string | null; fieldId: string | null; fieldKey: string | null }>
  >`
    SELECT id, "storageUrl", "fileType", "fileName", "displayName", "blockId", "fieldId", "fieldKey"
    FROM dpp_media
    WHERE "dppId" = ${dppId}
    ORDER BY "sortOrder" ASC, "uploadedAt" DESC
    LIMIT 100
  `
  const media = mediaRows.map(m => ({
    id: m.id,
    storageUrl: m.storageUrl,
    fileType: m.fileType,
    fileName: m.fileName,
    displayName: m.displayName ?? null,
    blockId: m.blockId || null,
    fieldId: m.fieldKey || null,
    fieldKey: m.fieldKey || null,
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
  const cmsBlocksRaw = dppContentRecord
    ? ((dppContentRecord.blocks as any) || []).filter((b: any) => {
        if (!b.content || b.data || b.type === "template_block") return false
        if (options.includeVersionInfo || versionRow) {
          return b.status === "published"
        }
        return true
      })
    : []
  // Explizit nach Reihenfolge aus dem Mehrwert-Tab sortieren (order = Index im Tab)
  const cmsBlocks = [...cmsBlocksRaw].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))

  // Transformiere CMS-Blöcke zu Unified Content Blocks (order ab 1000, damit nach Template-Blöcken)
  const ORDER_OFFSET_CMS = 1000
  const cmsUnifiedBlocks = await Promise.all(
    cmsBlocks.map(async (block: any, index: number) => {
      const unified = await adaptCmsBlockToUnified(block, dppId)
      unified.order = ORDER_OFFSET_CMS + (block.order ?? index)
      if (block.type === 'multi_question_poll') {
        (unified as any).dppId = dppId
      }
      return unified
    })
  )
  
  // Template-Block-Daten aus DppContent (co2, etc. – Felder, die nicht in DPP-Spalten sind)
  const templateBlocksFromContent = (dppContentRecord?.blocks as any[]) || []
  const templateBlockDataById = new Map<string, Record<string, any>>()
  templateBlocksFromContent
    .filter((b: any) => b.type === 'template_block' && b.data && typeof b.data === 'object')
    .forEach((b: any) => {
      if (b.id) templateBlockDataById.set(b.id, b.data)
    })

  // Transformiere Template-Blocks zu Unified Content Blocks
  const templateUnifiedBlocks: UnifiedContentBlock[] = template.blocks.map(block => {
    const supplierConfig = supplierConfigs[block.id] || null
    const blockData = templateBlockDataById.get(block.id) || {}
    const mergedDppContent = { ...dppContent, ...blockData }

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
      mergedDppContent,
      supplierConfig,
      media,
      versionInfo
    )
  })
  
  // Reihenfolge wie im DPP-Editor: Pflichtangaben (Template) zuerst, dann Mehrwert (CMS)
  // CMS-Blöcke haben order >= 1000, damit sort() sie korrekt nach Template-Blöcken einordnet
  return [...templateUnifiedBlocks, ...cmsUnifiedBlocks].sort((a, b) => a.order - b.order)
}
