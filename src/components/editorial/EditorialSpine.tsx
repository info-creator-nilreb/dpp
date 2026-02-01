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
import HeroImageBlock from './spine/HeroImageBlock'
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
}

export default function EditorialSpine({
  blocks,
  dppName,
  description,
  brandName,
  heroImageUrl,
  versionInfo,
  organizationLogoUrl,
  organizationName,
  organizationWebsite,
  basicData
}: EditorialSpineProps) {
  // Filter nur Spine-Blöcke
  const spineBlocks = blocks.filter(b => b.presentation.layer === "spine")
  
  // Sortiere nach order
  const sortedBlocks = [...spineBlocks].sort((a, b) => a.order - b.order)
  
  // Finde Hero-Bild Block (erster Block mit Bild oder explizit hero_image)
  const heroBlock = sortedBlocks.find(b => 
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
  
  // Extrahiere Hero-Bild URL
  const heroUrl = heroImageUrl || 
    (heroBlock ? (() => {
      const imageField = Object.values(heroBlock.content.fields)
        .find(f => f.type?.startsWith('file-image') || f.type === 'file-image')
      if (!imageField?.value) return undefined
      // Wert kann komma-separiert sein - nimm erste URL
      const value = imageField.value as string
      return value.includes(',') ? value.split(',')[0].trim() : value
    })() : undefined)
  
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
      {/* Hero Section mit Overlay und Logo - ohne Section-Wrapper, um grauen Balken zu vermeiden */}
      {heroUrl && (
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Logo (Top-Left) */}
          {organizationLogoUrl && (
            <Logo
              logoUrl={organizationLogoUrl}
              organizationName={organizationName}
              organizationWebsite={organizationWebsite}
            />
          )}
          <HeroImageBlock
            imageUrl={heroUrl}
            headline={headline}
            brandName={brandName}
            versionInfo={versionInfo}
          />
        </div>
      )}
      
      {/* Unter dem Hero: nur Beschreibung und/oder Basisdaten – kein HeadlineBlock; Hintergrund immer Weiß, nie grauer Balken */}
      {showContentBelowHero && (storyText || hasBasicData) && (
        <Section 
          variant="contained"
          backgroundColor="#FFFFFF"
          style={{ 
            paddingTop: editorialSpacing.xl,
            paddingBottom: editorialSpacing.xl 
          }}
        >
          {storyText ? (
            <StoryTextBlock text={storyText} basicData={basicData} />
          ) : hasBasicData && basicData ? (
            <>
              <div style={{
                width: '60px',
                height: '2px',
                backgroundColor: '#24c598',
                marginBottom: editorialSpacing.xl,
                marginLeft: 'auto',
                marginRight: 'auto',
              }} />
              <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem',
                fontSize: '0.875rem',
                color: '#7A7A7A',
                textAlign: 'center',
              }}>
                {(basicData.sku != null && basicData.sku !== '') && <div><strong>SKU</strong><br />{basicData.sku}</div>}
                {(basicData.gtin != null && basicData.gtin !== '') && <div><strong>GTIN</strong><br />{basicData.gtin}</div>}
                {(basicData.countryOfOrigin != null && basicData.countryOfOrigin !== '') && <div><strong>Herkunftsland</strong><br />{basicData.countryOfOrigin}</div>}
              </div>
            </>
          ) : null}
        </Section>
      )}
      {/* Headline-Bereich nur ohne Hero (z. B. wenn kein Produktbild) */}
      {!heroUrl && showContentBelowHero && (
        <Section variant="contained" style={{ paddingTop: editorialSpacing.xl, paddingBottom: editorialSpacing.xl }}>
          <HeadlineBlock text={headlineDisplay} brandName={brandName} versionInfo={versionInfo} />
          {hasBasicData && basicData && (
            <>
              <div style={{ width: '60px', height: '2px', backgroundColor: '#24c598', marginTop: editorialSpacing.xl, marginBottom: editorialSpacing.xl, marginLeft: 'auto', marginRight: 'auto' }} />
              <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: editorialSpacing.lg, fontSize: '0.875rem', color: '#7A7A7A', textAlign: 'center' }}>
                {(basicData.sku != null && basicData.sku !== '') && <div><strong>SKU</strong><br />{basicData.sku}</div>}
                {(basicData.gtin != null && basicData.gtin !== '') && <div><strong>GTIN</strong><br />{basicData.gtin}</div>}
                {(basicData.countryOfOrigin != null && basicData.countryOfOrigin !== '') && <div><strong>Herkunftsland</strong><br />{basicData.countryOfOrigin}</div>}
              </div>
            </>
          )}
        </Section>
      )}
    </>
  )
}
