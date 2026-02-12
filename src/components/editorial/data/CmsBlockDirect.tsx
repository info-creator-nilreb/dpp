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
import CmsBlockRenderer from './CmsBlockRenderer'

interface CmsBlockDirectProps {
  block: UnifiedContentBlock
  dppId?: string
}

export default function CmsBlockDirect({ block, dppId }: CmsBlockDirectProps) {
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
  
  // Text-/Storytelling-Blöcke: volle Breite, kein Padding-Container (Breakout)
  const isFullBleedBlock = isTextBlock

  return (
    <div style={{
      marginBottom: editorialSpacing.xl,
      ...(isFullBleedBlock ? {} : {
        maxWidth: '900px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: 'clamp(1rem, 4vw, 2rem)',
        paddingRight: 'clamp(1rem, 4vw, 2rem)',
      }),
    }}>
      {/* Block Title - nur wenn benutzerdefiniert */}
      {showTitle && (
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 500,
          color: editorialColors.text.primary,
          margin: 0,
          marginBottom: editorialSpacing.md,
          textTransform: 'none',
        }}>
          {customTitle}
        </h3>
      )}
      
      {/* Block Content */}
      <div style={isFullBleedBlock ? { width: '100%' } : undefined}>
        <CmsBlockRenderer block={block} dppId={dppId} />
      </div>
    </div>
  )
}
