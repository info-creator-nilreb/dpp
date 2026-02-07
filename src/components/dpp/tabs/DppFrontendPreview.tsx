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
  }, [dpp?.id, blocks, mounted]) // Re-load when dpp or blocks change

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

  // Hero = erstes Bild aus Basis- & Produktdaten (role "primary_product_image"). Fallback: erstes Bild mit blockId = Basisdaten-Block (falls role fehlt, z. B. ältere Uploads).
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
  const heroFromBasisdaten = getHeroImage(mediaList)
  const basisdatenBlockId = unifiedBlocks.find((b: { order?: number }) => b.order === 0)?.id
  const fallbackHeroFromBlock =
    basisdatenBlockId &&
    withoutLogo.find(
      (m: any) =>
        m.blockId === basisdatenBlockId && (m.fileType || "").startsWith("image/")
    )
  const heroImage =
    heroFromBasisdaten?.storageUrl ??
    (fallbackHeroFromBlock?.storageUrl as string | undefined) ??
    undefined

  // Galerie: weitere Bilder aus Basisdaten (role "gallery_image") + Bilder aus Mehrwert-Blöcken (unifiedBlocks)
  const galleryFromBasisdaten = getGalleryImages(mediaList)
  const galleryFromMehrwert = unifiedBlocks
    .filter((b: { blockKey?: string }) => b.blockKey === "image")
    .map((b: { content?: { fields?: { url?: { value?: string }; alt?: { value?: string }; caption?: { value?: string } } } }) => {
      const url = b.content?.fields?.url?.value
      if (!url || typeof url !== "string") return null
      return {
        url: String(url),
        alt: b.content?.fields?.alt?.value ? String(b.content.fields.alt.value) : undefined,
        caption: b.content?.fields?.caption?.value ? String(b.content.fields.caption.value) : undefined,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
  const galleryImages = [
    ...galleryFromBasisdaten.map((m) => ({ url: m.storageUrl, alt: m.fileName })),
    ...galleryFromMehrwert,
  ]

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
        basicData={{
          sku: dpp.sku,
          gtin: dpp.gtin,
          countryOfOrigin: dpp.countryOfOrigin
        }}
      />
    </div>
  )
}
