"use client"

/**
 * DPP Frontend Preview
 * 
 * Shows preview of how the DPP will look on the public page
 * Uses the new EditorialDppViewRedesign for consistency with public view
 */

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import EditorialDppViewRedesign from "@/components/editorial/EditorialDppViewRedesign"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Block, StylingConfig } from "@/lib/cms/types"
import { UnifiedContentBlock } from "@/lib/content-adapter"
import { getHeroImage, getGalleryImages, type MediaItem } from "@/lib/media/hero-logic"

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

export default function DppFrontendPreview({
  dpp,
  blocks,
  styling
}: DppFrontendPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [unifiedBlocks, setUnifiedBlocks] = useState<UnifiedContentBlock[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const previewScrollRef = useRef<HTMLDivElement>(null)

  // Mount effect - only run once
  useEffect(() => {
    setMounted(true)
    // Simulate loading for better UX perception (only on initial mount)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, []) // Only run on mount

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

  // Immer am Hero-Bild starten: Scroll auf 0 wenn Vorschau geladen (verhindert Sprung zu Basisdaten / Browser-Scroll-Restoration)
  const scrollPreviewToTop = () => {
    previewScrollRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }
  useLayoutEffect(() => {
    if (isLoading || error) return
    scrollPreviewToTop()
    const t0 = setTimeout(scrollPreviewToTop, 0)
    const t1 = requestAnimationFrame(() => {
      scrollPreviewToTop()
      requestAnimationFrame(scrollPreviewToTop)
    })
    const t2 = setTimeout(scrollPreviewToTop, 100)
    const t3 = setTimeout(scrollPreviewToTop, 300)
    return () => {
      clearTimeout(t0)
      clearTimeout(t2)
      clearTimeout(t3)
      cancelAnimationFrame(t1)
    }
  }, [isLoading, error, unifiedBlocks.length])

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

  // Hero = erstes Bild aus Basis- & Produktdaten (role "primary_product_image"). Fallbacks: blockId/Legacy, zuletzt erstes Bild.
  const withoutLogo = (dpp.media || []).filter((m: any) => m.role !== "logo")
  const mediaList: MediaItem[] = withoutLogo.map((m: any) => ({
    id: m.id,
    storageUrl: m.storageUrl,
    fileType: m.fileType || "",
    role: m.role ?? undefined,
    blockId: m.blockId ?? undefined,
    fieldKey: m.fieldKey ?? m.fieldId ?? undefined,
    fileName: m.fileName ?? (m.originalFileName as string) ?? "",
  }))
  const spineBlock = unifiedBlocks.find(
    (b: { presentation?: { layer?: string } }) => b.presentation?.layer === "spine"
  )
  const basisdatenBlockId = spineBlock?.id
  // Alle Bilder, die zum Spine/Basisdaten-Block gehören (blockId passend oder ohne blockId)
  const spineImages = withoutLogo.filter((m: any) => {
    if (!(m.fileType || "").startsWith("image/")) return false
    if (basisdatenBlockId) return m.blockId === basisdatenBlockId || m.blockId == null || m.blockId === ""
    return true
  })
  const heroFromBasisdaten = getHeroImage(mediaList)
  const fallbackHeroFromBlock = spineImages[0]
  const fallbackHeroLegacy =
    !heroFromBasisdaten &&
    !fallbackHeroFromBlock &&
    withoutLogo.find(
      (m: any) =>
        (m.fileType || "").startsWith("image/") &&
        (m.blockId == null || m.blockId === "")
    )
  const heroMedia =
    heroFromBasisdaten ??
    (fallbackHeroFromBlock ? { storageUrl: (fallbackHeroFromBlock as any).storageUrl } : null) ??
    (fallbackHeroLegacy ? { storageUrl: (fallbackHeroLegacy as any).storageUrl } : null)
  const heroImage =
    heroMedia?.storageUrl ??
    (withoutLogo.find((m: any) => (m.fileType || "").startsWith("image/")) as any)?.storageUrl ??
    undefined

  // Galerie: alle Spine-Bilder außer dem Hero + Bilder mit role "gallery_image"
  const galleryByRole = getGalleryImages(mediaList)
  const spineGalleryFiltered =
    basisdatenBlockId != null
      ? galleryByRole.filter(
          (m) =>
            m.blockId === basisdatenBlockId ||
            m.blockId == null ||
            m.blockId === ""
        )
      : galleryByRole
  const heroUrl = heroImage
  const galleryFromBasisdaten = [
    ...spineImages
      .filter((m: any) => (m as any).storageUrl !== heroUrl)
      .map((m: any) => ({ storageUrl: m.storageUrl, fileName: m.fileName ?? "" })),
    ...spineGalleryFiltered.filter((m) => m.storageUrl !== heroUrl).map((m) => ({ storageUrl: m.storageUrl, fileName: m.fileName ?? "" })),
  ]
  const seen = new Set<string>()
  const galleryFromBasisdatenDedup = galleryFromBasisdaten.filter((m) => {
    if (seen.has(m.storageUrl)) return false
    seen.add(m.storageUrl)
    return true
  })
  // Nur Basisdaten-Galerie ans Ende; Mehrwert-Bildblöcke werden in DataSectionsContainer an ihrer Position gerendert
  const galleryImages = galleryFromBasisdatenDedup.map((m) => ({ url: m.storageUrl, alt: m.fileName }))

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

  return (
    <div
      ref={previewScrollRef}
      style={{
        flex: 1,
        overflowY: "auto",
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
        heroImageUrl={heroImage}
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
