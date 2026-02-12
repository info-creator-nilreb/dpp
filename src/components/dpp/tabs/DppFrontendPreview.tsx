"use client"

/**
 * DPP Frontend Preview
 * 
 * Shows preview of how the DPP will look on the public page
 * Uses the new EditorialDppViewRedesign for consistency with public view
 */

import { useState, useEffect, useLayoutEffect, useRef, forwardRef, useImperativeHandle } from "react"
import EditorialDppViewRedesign from "@/components/editorial/EditorialDppViewRedesign"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Block, StylingConfig } from "@/lib/cms/types"
import { UnifiedContentBlock } from "@/lib/content-adapter"
import type { MediaItem } from "@/lib/media/hero-logic"

export interface DppFrontendPreviewHandle {
  scrollToTop: () => void
}

interface DppFrontendPreviewProps {
  dpp: any
  blocks: Block[]
  styling: StylingConfig | null
}

/**
 * Skeleton Loader for Preview
 */
function PreviewSkeleton() {
  return (
    <div style={{
      padding: "2rem",
      backgroundColor: "#FFFFFF"
    }}>
      {/* Hero Skeleton */}
      <div style={{
        width: "100%",
        height: "400px",
        backgroundColor: "#F5F5F5",
        borderRadius: "12px",
        marginBottom: "2rem",
        animation: "pulse 2s ease-in-out infinite"
      }} />
      
      {/* Content Skeleton */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            marginBottom: "2rem"
          }}>
            <div style={{
              width: "60%",
              height: "24px",
              backgroundColor: "#F5F5F5",
              borderRadius: "4px",
              marginBottom: "1rem",
              animation: "pulse 2s ease-in-out infinite"
            }} />
            <div style={{
              width: "100%",
              height: "16px",
              backgroundColor: "#F5F5F5",
              borderRadius: "4px",
              marginBottom: "0.5rem",
              animation: "pulse 2s ease-in-out infinite"
            }} />
            <div style={{
              width: "80%",
              height: "16px",
              backgroundColor: "#F5F5F5",
              borderRadius: "4px",
              animation: "pulse 2s ease-in-out infinite"
            }} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}

function DppFrontendPreviewInner({
  dpp,
  blocks,
  styling
}: DppFrontendPreviewProps, ref: React.Ref<DppFrontendPreviewHandle>) {
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [unifiedBlocks, setUnifiedBlocks] = useState<UnifiedContentBlock[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const stableHeroUrlRef = useRef<string | undefined>(undefined)
  const lastDppIdRef = useRef<string | undefined>(undefined)
  const scrollLastDppIdRef = useRef<string | undefined>(undefined)
  const didScrollForLoadRef = useRef(false)

  // Mount effect - only run once (loading ends when unified-blocks fetch completes)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load UnifiedContentBlocks from API when dpp or blocks change
  useEffect(() => {
    async function loadUnifiedBlocks() {
      if (!dpp?.id) {
        setUnifiedBlocks([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch UnifiedContentBlocks from API (server-side transformation)
        const response = await fetch(`/api/app/dpp/${dpp.id}/unified-blocks`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Laden der Vorschau")
        }
        
        const data = await response.json()
        setUnifiedBlocks(data.blocks || [])
        setIsLoading(false)
      } catch (err: any) {
        console.error("[DppFrontendPreview] Error loading unified blocks:", err)
        setError(err.message || "Fehler beim Laden der Vorschau")
        setIsLoading(false)
      }
    }

    if (mounted && dpp?.id) {
      loadUnifiedBlocks()
    }
  }, [dpp?.id, mounted]) // Nur bei dpp.id laden – kein Refetch bei blocks-Änderung, damit Galerie und Mehrwert-Blöcke gemeinsam erscheinen

  // Immer am Hero starten: sofort beim Mount des Scroll-Containers + nach Laden mehrfach nachziehen
  const scrollPreviewToTop = () => {
    const el = previewScrollRef.current
    if (el) {
      el.scrollTop = 0
      el.scrollTo(0, 0)
    }
  }
  useImperativeHandle(ref, () => ({ scrollToTop: scrollPreviewToTop }), [])

  useLayoutEffect(() => {
    if (dpp?.id !== scrollLastDppIdRef.current) {
      scrollLastDppIdRef.current = dpp?.id
      didScrollForLoadRef.current = false
    }
    if (isLoading || error) return
    didScrollForLoadRef.current = true
    scrollPreviewToTop()
    const t0 = setTimeout(scrollPreviewToTop, 0)
    const t1 = requestAnimationFrame(scrollPreviewToTop)
    const t2 = setTimeout(scrollPreviewToTop, 100)
    const t3 = setTimeout(scrollPreviewToTop, 250)
    const t4 = setTimeout(scrollPreviewToTop, 500)
    const t5 = setTimeout(scrollPreviewToTop, 800)
    return () => {
      clearTimeout(t0)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      cancelAnimationFrame(t1)
    }
  }, [dpp?.id, isLoading, error])

  // Nach dem Rendern der Blöcke nochmals nachziehen (Kind-Komponenten können verzögert scrollen)
  useLayoutEffect(() => {
    if (!unifiedBlocks.length || isLoading || error) return
    scrollPreviewToTop()
    const t1 = setTimeout(scrollPreviewToTop, 50)
    const t2 = setTimeout(scrollPreviewToTop, 200)
    const t3 = setTimeout(scrollPreviewToTop, 450)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [unifiedBlocks.length, isLoading, error])

  // Kurz nach Laden bei Größenänderung (z. B. Bilder) Scroll oben halten – verhindert Sprung durch Layout-Shift
  useEffect(() => {
    if (isLoading || error) return
    const el = previewScrollRef.current
    if (!el) return
    const deadline = Date.now() + 2000
    const ro = new ResizeObserver(() => {
      if (Date.now() > deadline) return
      el.scrollTop = 0
      el.scrollTo(0, 0)
    })
    ro.observe(el)
    const t = setTimeout(() => ro.disconnect(), 2000)
    return () => {
      clearTimeout(t)
      ro.disconnect()
    }
  }, [isLoading, error])

  if (!mounted || !dpp) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF"
      }}>
        <LoadingSpinner message="Vorschau wird generiert..." />
      </div>
    )
  }

  if (isLoading) {
    return <PreviewSkeleton />
  }

  if (error) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        padding: "2rem"
      }}>
        <div style={{
          padding: "1.5rem",
          backgroundColor: "#FFF5F5",
          border: "1px solid #FECACA",
          borderRadius: "8px",
          color: "#991B1B",
          textAlign: "center"
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Fehler</p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); setRetryCount((c) => c + 1) }}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#991B1B",
              backgroundColor: "#FEE2E2",
              border: "1px solid #FECACA",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // Get organization info; Hersteller = Marke oder Organisationsname (wenn angegeben)
  const organizationName = dpp.organization?.name || ""
  const brandName = dpp.brand || organizationName || ""

  const spineBlocks = (unifiedBlocks || []).filter(
    (b: { presentation?: { layer?: string } }) => b.presentation?.layer === "spine"
  )
  const spineBlock = spineBlocks[0]
  const spineBlockIds = new Set(spineBlocks.map((b: { id?: string }) => b.id).filter(Boolean))
  const dataBlockIds = new Set(
    (unifiedBlocks || [])
      .filter((b: { presentation?: { layer?: string } }) => b.presentation?.layer === "data")
      .map((b: { id?: string }) => b.id)
      .filter(Boolean)
  )
  const productDataBlock = spineBlocks.find((b: any) =>
    Object.values(b.content?.fields || {}).some(
      (f: any) => f.type === "file-image" || f.type?.startsWith?.("file-image")
    )
  )
  const basisdatenBlockId = productDataBlock?.id ?? spineBlock?.id
  const withoutLogo = (dpp.media || []).filter((m: any) => m.role !== "logo")
  // Hero nur aus Basisdaten: Block „Basis- & Produktdaten“ oder ohne blockId (Legacy). Keine Bilder aus Mehrwert-Blöcken.
  const basisdatenHeroMediaOnly = withoutLogo.filter((m: any) => {
    if (!(m.fileType || "").startsWith("image/")) return false
    if (m.blockId && dataBlockIds.has(m.blockId)) return false // Mehrwert-Bilder nie als Hero
    return m.blockId === basisdatenBlockId || m.blockId == null || m.blockId === ""
  })
  const heroImage = basisdatenHeroMediaOnly[0]?.storageUrl ?? undefined

  // Hero-URL stabil halten: nur bei DPP-Wechsel oder wenn URL nicht mehr in Medien ist zurücksetzen (verhindert Flackern / verwaiste Thumbnails)
  if (dpp?.id !== lastDppIdRef.current) {
    lastDppIdRef.current = dpp?.id
    stableHeroUrlRef.current = undefined
  }
  const mediaUrls = new Set((dpp?.media ?? []).map((m: { storageUrl?: string }) => m.storageUrl))
  if (stableHeroUrlRef.current && !mediaUrls.has(stableHeroUrlRef.current)) {
    stableHeroUrlRef.current = undefined
  }
  if (heroImage) stableHeroUrlRef.current = heroImage
  else if ((dpp?.media?.length ?? 0) === 0) stableHeroUrlRef.current = undefined
  // Wenn ein Hero aus Basisdaten existiert, nutzen. Sonst: sobald irgendein Produktbild existiert, das als Hero genutzt werden kann, anzeigen (kein Fallback mit farbigem Hintergrund flackern).
  const provisionalHeroUrl = (withoutLogo.find((m: any) => (m.fileType || "").startsWith("image/")) as any)?.storageUrl
  const displayHeroUrl = stableHeroUrlRef.current ?? heroImage ?? provisionalHeroUrl

  // Galerie: nur gültige Medien (blockId in aktuellen Blöcken oder leer), damit keine Verwaisten
  const validBlockIds = new Set(unifiedBlocks.map((b: { id?: string }) => b.id).filter(Boolean))
  const validMedia = withoutLogo.filter(
    (m: any) =>
      m.blockId == null ||
      m.blockId === "" ||
      m.blockId === basisdatenBlockId ||
      validBlockIds.has(m.blockId)
  )
  const mediaList: MediaItem[] = validMedia.map((m: any) => ({
    id: m.id,
    storageUrl: m.storageUrl,
    fileType: m.fileType || "",
    role: m.role ?? undefined,
    blockId: m.blockId ?? undefined,
    fieldKey: m.fieldKey ?? m.fieldId ?? undefined,
    fileName: m.fileName ?? (m.originalFileName as string) ?? "",
  }))
  // Thumbnails nur aus dem Basisdaten-Block (blockId = basisdatenBlockId), keine verwaisten Einträge ohne blockId
  const basisdatenOnlyImages = withoutLogo.filter((m: any) => {
    if (!(m.fileType || "").startsWith("image/")) return false
    if (m.blockId && dataBlockIds.has(m.blockId)) return false // Mehrwert-Bilder ausblenden
    if (!basisdatenBlockId) return false
    return m.blockId === basisdatenBlockId // strikt: nur explizit zugewiesene Bilder, keine null/empty blockId
  })

  const basisdatenHeroImages = basisdatenOnlyImages.map((m: any) => ({
    url: m.storageUrl,
    alt: m.fileName ?? (m.originalFileName as string) ?? ""
  }))

  // Keine zentrale Galerie am Ende: Mehrwert-Bilder werden nur inline in DataSectionsContainer an ihrer Block-Position gerendert (keine Doppelung).
  const galleryImages: Array<{ url: string; alt?: string }> = []

  // basicData: dpp (Client-State) zuerst, damit ungespeicherte Änderungen (z. B. geleertes EAN) in der Vorschau sichtbar sind
  const spineFields = spineBlock?.content?.fields as Record<string, { value?: string | null }> | undefined
  const fromBlock = (key: string) => {
    if (!spineFields) return undefined
    const v = spineFields[key]?.value ?? spineFields[key.toLowerCase()]?.value
    return v != null && String(v).trim() !== "" ? String(v).trim() : undefined
  }
  // dpp zuerst (?? behält "" bei), damit geleerte Felder in der Vorschau nicht mehr angezeigt werden
  const basicData = {
    sku: dpp.sku ?? fromBlock("sku") ?? undefined,
    gtin: dpp.gtin ?? fromBlock("gtin") ?? fromBlock("ean") ?? undefined,
    countryOfOrigin: dpp.countryOfOrigin ?? fromBlock("countryOfOrigin") ?? fromBlock("herstellungsland") ?? undefined,
  }

  // Get logo from styling config
  const organizationLogoUrl = styling?.logo?.url || undefined

  // Ref-Callback: Sobald der Scroll-Container im DOM ist, sofort auf 0 setzen (bevor Kind-Effekte scrollen)
  const setScrollRef = (el: HTMLDivElement | null) => {
    ;(previewScrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    if (el) {
      el.scrollTop = 0
      el.scrollTo(0, 0)
    }
  }

  return (
    <div
      ref={setScrollRef}
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        backgroundColor: "#FFFFFF"
      }}
    >
      {/* Preview Container - uses new EditorialDppViewRedesign (isPreview: kein 100vh, weniger Abstand unten) */}
      <EditorialDppViewRedesign
        blocks={unifiedBlocks}
        dppName={dpp.name || ""}
        description={dpp.description ?? undefined}
        dppId={dpp.id}
        brandName={brandName}
        organizationName={organizationName}
        organizationLogoUrl={organizationLogoUrl}
        heroImageUrl={displayHeroUrl}
        basisdatenHeroImages={basisdatenHeroImages.length > 1 ? basisdatenHeroImages : undefined}
        galleryImages={galleryImages}
        styling={styling}
        isPreview
        versionInfo={dpp.versions?.[0] ? {
          version: dpp.versions[0].version,
          createdAt: new Date(dpp.versions[0].createdAt)
        } : undefined}
        basicData={basicData}
      />
    </div>
  )
}

const DppFrontendPreview = forwardRef<DppFrontendPreviewHandle, DppFrontendPreviewProps>(DppFrontendPreviewInner)
export default DppFrontendPreview
