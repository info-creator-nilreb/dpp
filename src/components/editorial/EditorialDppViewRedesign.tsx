/**
 * Editorial DPP View - Redesign
 * 
 * Neue Redesign-Version mit Editorial Spine + Data Sections
 * Nutzt Unified Content Blocks für Template-Flexibilität
 */

"use client"

import React from 'react'
import { Page } from './index'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import type { StylingConfig } from '@/lib/cms/types'
import EditorialSpine from './EditorialSpine'
import DataSectionsContainer from './data/DataSectionsContainer'
import Logo from './Logo'

interface EditorialDppViewRedesignProps {
  blocks: UnifiedContentBlock[]
  dppName: string
  dppId?: string
  description?: string | null
  brandName?: string
  organizationName?: string
  organizationLogoUrl?: string
  organizationWebsite?: string
  heroImageUrl?: string
  versionInfo?: {
    version: number
    createdAt: Date
  }
  basicData?: {
    sku?: string | null
    gtin?: string | null
    countryOfOrigin?: string | null
  }
  /** Styling (Farben, Logo, Schrift) – wird in der Vorschau für Theme genutzt */
  styling?: StylingConfig | null
  /** true = Editor-Vorschau (kein 100vh, weniger Abstand unten) */
  isPreview?: boolean
}

export default function EditorialDppViewRedesign({
  blocks,
  dppName,
  dppId,
  description,
  brandName,
  organizationName,
  organizationLogoUrl,
  organizationWebsite,
  heroImageUrl,
  versionInfo,
  basicData,
  styling,
  isPreview = false
}: EditorialDppViewRedesignProps) {
  return (
    <Page styling={styling ?? undefined} fillViewport={!isPreview}>
      {/* Editorial Spine mit Logo */}
      <EditorialSpine
        blocks={blocks}
        dppName={dppName}
        description={description}
        brandName={brandName}
        heroImageUrl={heroImageUrl}
        versionInfo={versionInfo}
        organizationLogoUrl={organizationLogoUrl}
        organizationName={organizationName}
        organizationWebsite={organizationWebsite}
        basicData={basicData}
      />
      
      {/* Data Sections */}
      <DataSectionsContainer 
        blocks={blocks} 
        dppId={dppId}
        hasStoryText={
          !!description ||
          blocks.some(b => 
            b.presentation.layer === "spine" && 
            Object.values(b.content.fields).some(f => f.type === 'textarea' || f.key === 'description')
          )
        }
      />
      
      {/* Bottom Padding für Sticky Elements / Abschluss – in Vorschau reduziert */}
      <div style={{ height: isPreview ? '2rem' : '120px' }} />
    </Page>
  )
}
