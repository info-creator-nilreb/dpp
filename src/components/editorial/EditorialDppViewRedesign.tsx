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
import EditorialSpine from './EditorialSpine'
import DataSectionsContainer from './data/DataSectionsContainer'
import Logo from './Logo'

interface EditorialDppViewRedesignProps {
  blocks: UnifiedContentBlock[]
  dppName: string
  dppId?: string
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
}

export default function EditorialDppViewRedesign({
  blocks,
  dppName,
  dppId,
  brandName,
  organizationName,
  organizationLogoUrl,
  organizationWebsite,
  heroImageUrl,
  versionInfo,
  basicData
}: EditorialDppViewRedesignProps) {
  return (
    <Page>
      {/* Editorial Spine mit Logo */}
      <EditorialSpine
        blocks={blocks}
        dppName={dppName}
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
        hasStoryText={blocks.some(b => 
          b.presentation.layer === "spine" && 
          Object.values(b.content.fields).some(f => f.type === 'textarea' || f.key === 'description')
        )}
      />
      
      {/* Bottom Padding für Sticky Elements */}
      <div style={{ height: '120px' }} />
    </Page>
  )
}
