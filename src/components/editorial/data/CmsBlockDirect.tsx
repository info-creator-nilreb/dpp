/**
 * CMS Block Direct Renderer
 * 
 * Rendert CMS-Blöcke direkt ohne Akkordion-Funktionalität
 * Orientiert an edelweiss-Struktur
 */

"use client"

import React from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import { editorialColors } from '../tokens/colors'
import { editorialSpacing } from '../tokens/spacing'
import { editorialTheme } from '../tokens/theme'
import CmsBlockRenderer from './CmsBlockRenderer'

interface CmsBlockDirectProps {
  block: UnifiedContentBlock
  dppId?: string
  isPreview?: boolean
}

export default function CmsBlockDirect({ block, dppId, isPreview = false }: CmsBlockDirectProps) {
  // Prüfe ob es einen benutzerdefinierten Titel im Content gibt
  // Titel-Felder: title, heading, name (je nach Block-Typ)
  const customTitle = block.content?.fields?.title?.value || 
    block.content?.fields?.heading?.value || 
    block.content?.fields?.name?.value
  
  // Generische BlockType-Namen, die nicht angezeigt werden sollen
  const genericBlockNames = ['image', 'Image', 'Bild', 'text', 'Text', 'video', 'Video', 'gallery', 'Gallery']
  // Text-/Storytelling-Block: Kein fixer Titel – Überschrift + Inhalt kommen plakativ im Renderer
  const isTextBlock = block.blockKey === 'text_block' || block.blockKey === 'text' || block.blockKey === 'storytelling'
  const isGenericName = !customTitle || 
    (typeof block.displayName === 'string' && genericBlockNames.includes(block.displayName)) ||
    (typeof customTitle === 'string' && genericBlockNames.includes(customTitle))
  const showTitle = !isTextBlock && !!customTitle && typeof customTitle === 'string' && customTitle.trim().length > 0 && !isGenericName
  
  const isFullBleedBlock = isTextBlock
  const isPollBlock = block.blockKey === 'multi_question_poll' || block.blockKey === 'quick_poll' || block.blockKey === 'poll'
  const isVideoBlock = block.blockKey === 'video_block' || block.blockKey === 'video'
  const isFillCardBlock = isPollBlock || isVideoBlock

  const { spacing, radius, color } = editorialTheme

  // Full-bleed: Breite und Breakout via CSS (editorial-desktop.css), nicht inline
  const fullBleedWrapperStyle: React.CSSProperties = {
    position: 'relative' as const,
    marginBottom: editorialSpacing.xl,
  }
  if (isFullBleedBlock) {
    return (
      <div className="fullbleed-wrapper" style={fullBleedWrapperStyle}>
        {showTitle && (
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>
            <h3 style={{
              fontSize: editorialTheme.typography.fontSizeSectionTitle,
              fontWeight: 500,
              color: editorialColors.text.primary,
              margin: 0,
              marginBottom: editorialSpacing.md,
              textTransform: 'none',
            }}>
              {customTitle}
            </h3>
          </div>
        )}
        <CmsBlockRenderer block={block} dppId={dppId} isPreview={isPreview} />
      </div>
    )
  }

  // Card-Blöcke: Umfrage + Video füllen den Container vollständig (kein grauer Rand)
  const cardClassName = isVideoBlock ? 'editorial-video-wrapper-desktop' : undefined
  const cardStyle: React.CSSProperties = isFillCardBlock
    ? {
        marginBottom: editorialSpacing.xl,
        borderRadius: radius.lg,
        padding: 0,
        overflow: 'hidden',
        border: 'none',
        boxShadow: 'none',
      }
    : {
        marginBottom: editorialSpacing.xl,
        backgroundColor: color.backgroundSection,
        borderRadius: radius.lg,
        padding: spacing.lg,
        border: 'none',
        boxShadow: 'none',
      }

  return (
    <div className={cardClassName} style={cardStyle}>
      {showTitle && !isFillCardBlock && (
        <h3 style={{
          fontSize: editorialTheme.typography.fontSizeSectionTitle,
          fontWeight: 600,
          color: color.textPrimary,
          margin: 0,
          marginBottom: spacing.lg,
          letterSpacing: editorialTheme.typography.letterSpacingSection,
        }}>
          {customTitle}
        </h3>
      )}
      <CmsBlockRenderer block={block} dppId={dppId} fillCard={isFillCardBlock} isPreview={isPreview} />
    </div>
  )
}
