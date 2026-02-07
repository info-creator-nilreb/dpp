/**
 * Editorial DPP View - Redesign
 * 
 * Neue Redesign-Version mit Editorial Spine + Data Sections
 * Nutzt Unified Content Blocks für Template-Flexibilität
 */

"use client"

import React from 'react'
import { Page, Section } from './index'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import type { StylingConfig } from '@/lib/cms/types'
import EditorialSpine from './EditorialSpine'
import type { HeroImageItem } from './EditorialSpine'
import DataSectionsContainer from './data/DataSectionsContainer'
import ImageGallery from './data/ImageGallery'
import { editorialSpacing } from './tokens/spacing'

interface GalleryImageItem {
  url: string
  alt?: string
  caption?: string
}

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
  /** Alle Basisdaten-Bilder in Reihenfolge (für Hero + Thumbnail-Strip) */
  basisdatenHeroImages?: HeroImageItem[]
  /** Galerie: weitere Bilder aus Basisdaten (2+) + Bilder aus Mehrwert-Blöcken */
  galleryImages?: GalleryImageItem[]
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
  basisdatenHeroImages,
  galleryImages = [],
  versionInfo,
  basicData,
  styling,
  isPreview = false
}: EditorialDppViewRedesignProps) {
  return (
    <Page styling={styling ?? undefined} fillViewport={!isPreview}>
      {/* Editorial Spine mit Logo + optionalem Hinweis bei fehlendem Hero */}
      <EditorialSpine
        blocks={blocks}
        dppName={dppName}
        description={description}
        brandName={brandName}
        heroImageUrl={heroImageUrl}
        basisdatenHeroImages={basisdatenHeroImages}
        versionInfo={versionInfo}
        organizationLogoUrl={organizationLogoUrl}
        organizationName={organizationName}
        organizationWebsite={organizationWebsite}
        basicData={basicData}
        isPreview={isPreview}
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
      
      {/* Galerie: weitere Basisdaten-Bilder (2+) + Mehrwert-Bilder */}
      {galleryImages.length > 0 && (
        <Section variant="contained" style={{ paddingTop: editorialSpacing.xl, paddingBottom: editorialSpacing.xl }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '2rem',
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}>
            Galerie
          </h2>
          <ImageGallery images={galleryImages} alignment="center" />
        </Section>
      )}
      
      {/* Bottom Padding für Sticky Elements / Abschluss – in Vorschau reduziert */}
      <div style={{ height: isPreview ? '2rem' : '120px' }} />
    </Page>
  )
}
