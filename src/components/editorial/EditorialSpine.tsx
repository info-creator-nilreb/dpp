/**
 * Editorial Spine Component
 * 
 * Container für Editorial Spine (immer sichtbar, narrativ)
 * Rendert Hero, Headline, Story-Text basierend auf Unified Content Blocks
 */

"use client"

import React from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import { Section, editorialSpacing } from './index'
import { editorialColors } from './tokens/colors'
import HeroImageBlock from './spine/HeroImageBlock'
import type { HeroImageItem } from './spine/HeroImageBlock'
import HeadlineBlock from './spine/HeadlineBlock'
import StoryTextBlock from './spine/StoryTextBlock'
import VersionInfoBlock from './spine/VersionInfoBlock'

import Logo from './Logo'

interface EditorialSpineProps {
  blocks: UnifiedContentBlock[]
  dppName: string
  description?: string | null
  brandName?: string
  heroImageUrl?: string
  /** Alle Basisdaten-Bilder in Reihenfolge (für Hero + Thumbnail-Strip) */
  basisdatenHeroImages?: HeroImageItem[]
  versionInfo?: {
    version: number
    createdAt: Date
  }
  organizationLogoUrl?: string
  organizationName?: string
  organizationWebsite?: string
  basicData?: {
    sku?: string | null
    gtin?: string | null
    countryOfOrigin?: string | null
  }
  /** true = Editor-Vorschau; bei fehlendem Hero wird ein Hinweis angezeigt */
  isPreview?: boolean
  /** Hero nur aus heroImageUrl verwenden (kein Fallback auf Block-Content); für Basis-daten-only-Hero */
  useOnlyPassedHeroImage?: boolean
}

export default function EditorialSpine({
  blocks,
  dppName,
  description,
  brandName,
  heroImageUrl,
  basisdatenHeroImages,
  versionInfo,
  organizationLogoUrl,
  organizationName,
  organizationWebsite,
  basicData,
  isPreview = false,
  useOnlyPassedHeroImage = false
}: EditorialSpineProps) {
  // Filter nur Spine-Blöcke
  const spineBlocks = blocks.filter(b => b.presentation.layer === "spine")
  
  // Sortiere nach order
  const sortedBlocks = [...spineBlocks].sort((a, b) => a.order - b.order)
  
  // Finde Hero-Bild Block (nur genutzt wenn useOnlyPassedHeroImage false)
  const heroBlock = useOnlyPassedHeroImage ? null : sortedBlocks.find(b => 
    b.blockKey.includes('hero') || 
    Object.values(b.content.fields).some(f => f.type?.startsWith('file-image'))
  )
  
  // Finde Headline Block
  const headlineBlock = sortedBlocks.find(b => 
    b.blockKey.includes('headline') ||
    b.displayName.toLowerCase().includes('headline') ||
    b.order === 0
  )
  
  // Finde Story-Text Block
  const storyBlock = sortedBlocks.find(b => 
    b.blockKey.includes('story') ||
    b.displayName.toLowerCase().includes('story') ||
    Object.values(b.content.fields).some(f => f.type === 'textarea')
  )
  
  // Hero-URL: nur aus Prop (Basis-daten-only) oder Fallback auf Block-Content
  const heroUrl = useOnlyPassedHeroImage
    ? (heroImageUrl ?? undefined)
    : (heroImageUrl ||
        (heroBlock ? (() => {
          const imageField = Object.values(heroBlock.content.fields)
            .find(f => f.type?.startsWith('file-image') || f.type === 'file-image')
          if (!imageField?.value) return undefined
          const value = imageField.value as string
          return value.includes(',') ? value.split(',')[0].trim() : value
        })() : undefined))
  
  // Extrahiere Headline
  const headline = headlineBlock 
    ? Object.values(headlineBlock.content.fields)
        .find(f => f.key === 'name' || f.type === 'text')?.value as string || dppName
    : dppName
  
  // Story-Text: aus Block oder Fallback auf dpp.description (damit unter dem Hero immer Inhalt angezeigt wird)
  const storyFromBlock = storyBlock
    ? Object.values(storyBlock.content.fields)
        .find(f => f.type === 'textarea' || f.key === 'description')?.value as string | undefined
    : undefined
  const storyText = (storyFromBlock && String(storyFromBlock).trim()) || (description && String(description).trim()) || ''
  
  // Immer einen Abschnitt unter dem Hero anzeigen, wenn Hero da ist – keine hardcodierte Beschränkung auf Name/Bild
  const hasBasicData = basicData && (basicData.sku != null && basicData.sku !== '' || basicData.gtin != null && basicData.gtin !== '' || basicData.countryOfOrigin != null && basicData.countryOfOrigin !== '')
  const showContentBelowHero = !!heroUrl || !!headline || !!storyText || hasBasicData
  const headlineDisplay = (headline && String(headline).trim()) || dppName
  
  return (
    <>
      {/* Mit Hero: Hero-Bereich (Bild + Produktname) ganz oben */}
      {heroUrl && (
        <div style={{ position: 'relative', width: '100%' }}>
          {organizationLogoUrl && (
            <Logo
              logoUrl={organizationLogoUrl}
              organizationName={organizationName}
              organizationWebsite={organizationWebsite}
            />
          )}
          <HeroImageBlock
            imageUrl={heroUrl}
            images={basisdatenHeroImages && basisdatenHeroImages.length > 1 ? basisdatenHeroImages : undefined}
            headline={headline}
            brandName={brandName}
            versionInfo={versionInfo}
          />
        </div>
      )}
      
      {/* Ohne Hero: nur Produktname (nur aus Basisdaten); Akzent-Hintergrund für bessere UX */}
      {!heroUrl && showContentBelowHero && (
        <Section
          variant="contained"
          style={{
            paddingTop: editorialSpacing.xl,
            paddingBottom: editorialSpacing.xl,
            backgroundColor: editorialColors.brand.accentVar,
          }}
        >
          <HeadlineBlock
            text={headlineDisplay}
            brandName={brandName}
            versionInfo={versionInfo}
            onAccentBackground
          />
          {isPreview && (
            <p style={{
              marginTop: editorialSpacing.lg,
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              maxWidth: '480px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Laden Sie in den Pflichtdaten unter „Basis- & Produktdaten“ mindestens ein Produktbild hoch – es wird hier als Hero angezeigt.
            </p>
          )}
        </Section>
      )}
      
      {/* Unter Hero bzw. unter Headline: Beschreibung und/oder Basisdaten (GTIN, Herkunftsland) */}
      {showContentBelowHero && (storyText || hasBasicData) && (
        <Section 
          variant="contained"
          backgroundColor="#FFFFFF"
          style={{ 
            paddingTop: editorialSpacing.xl,
            paddingBottom: editorialSpacing.xl 
          }}
        >
          {storyText || (hasBasicData && basicData) ? (
            <StoryTextBlock text={storyText || ''} basicData={basicData} />
          ) : null}
        </Section>
      )}
    </>
  )
}
