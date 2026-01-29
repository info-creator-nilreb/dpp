"use client"

/**
 * DPP Frontend Preview
 * 
 * Shows preview of how the DPP will look on the public page
 * Uses the new EditorialDppViewRedesign for consistency with public view
 */

import { useState, useEffect } from "react"
import EditorialDppViewRedesign from "@/components/editorial/EditorialDppViewRedesign"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Block, StylingConfig } from "@/lib/cms/types"
import { UnifiedContentBlock } from "@/lib/content-adapter"

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
          color: "#991B1B"
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Fehler</p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>{error}</p>
        </div>
      </div>
    )
  }

  // Get organization info
  const organizationName = dpp.organization?.name || ""
  const brandName = dpp.brand || ""
  const heroImage = dpp.media?.find((m: any) => m.role === "hero_image" || m.role === "product_image")?.storageUrl
  // Get logo from styling config
  const organizationLogoUrl = styling?.logo?.url || undefined

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      backgroundColor: "#FFFFFF"
    }}>
      {/* Preview Container - uses new EditorialDppViewRedesign */}
      <EditorialDppViewRedesign
        blocks={unifiedBlocks}
        dppName={dpp.name || ""}
        dppId={dpp.id}
        brandName={brandName}
        organizationName={organizationName}
        organizationLogoUrl={organizationLogoUrl}
        heroImageUrl={heroImage}
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
