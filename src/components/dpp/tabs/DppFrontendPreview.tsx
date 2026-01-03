"use client"

/**
 * DPP Frontend Preview
 * 
 * Shows preview of how the DPP will look on the public page
 * Uses the same components as the public view for consistency
 */

import { useState, useEffect } from "react"
import EditorialDppView from "@/components/editorial/EditorialDppView"
import { BlocksRenderer } from "@/components/cms/renderers/BlockRenderer"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Block, StylingConfig } from "@/lib/cms/types"

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

  // Mount effect - only run once
  useEffect(() => {
    setMounted(true)
    // Simulate loading for better UX perception (only on initial mount)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, []) // Only run on mount

  // Reset loading when dpp or blocks change (but not styling - styling changes should be instant)
  useEffect(() => {
    if (mounted && (dpp || blocks.length > 0)) {
      setIsLoading(false)
    }
  }, [dpp, blocks, mounted]) // Exclude styling from this effect - styling changes should update immediately

  // Prepare DPP data for EditorialDppView
  const dppData = dpp ? {
    id: dpp.id,
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
    organization: dpp.organization || { name: "" },
    media: dpp.media || []
  } : null

  if (!mounted || !dppData) {
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

  // In preview, show all blocks (published and draft) to see what will be published
  const visibleBlocks = blocks.filter(b => b.status === "published" || b.status === "draft")

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      backgroundColor: "#FFFFFF"
    }}>
      {/* Preview Container - matches public view structure */}
      <div className="dpp-public-view">
        {/* Compliance Sections (always rendered) */}
        <EditorialDppView dpp={dppData} styling={styling} />

        {/* CMS Content Blocks (if available) */}
        {visibleBlocks.length > 0 && (
          <div className="cms-content-section" style={{ marginTop: "3rem" }}>
            <BlocksRenderer
              blocks={blocks}
              styling={styling}
              includeDrafts={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
