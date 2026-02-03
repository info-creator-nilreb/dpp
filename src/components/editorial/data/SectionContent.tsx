/**
 * Section Content Component
 * 
 * Rendert Fields aus einem Unified Content Block
 * Mit visueller Abwechslung und verschiedenen Layouts
 */

"use client"

import React from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import { editorialColors } from '../tokens/colors'
import { editorialSpacing } from '../tokens/spacing'
import MediaGallery from './MediaGallery'
import CmsBlockRenderer from './CmsBlockRenderer'

interface SectionContentProps {
  block: UnifiedContentBlock
  variant?: 'default' | 'minimal' | 'spacious'
  visualStyle?: 'default' | 'accent' | 'background' | 'bordered'
}

export default function SectionContent({ block, variant = 'minimal', visualStyle = 'default' }: SectionContentProps) {
  console.log('[SectionContent] START - Component called for:', block.displayName, 'blockKey:', block.blockKey)
  
  // Prüfe ob es ein CMS-Block ist (hat blockKey als BlockType.key)
  // CMS-Blocks haben bekannte BlockType-Keys wie "timeline", "accordion", etc.
  // Template-Blocks haben keys wie "data-1", "data-2" oder lange IDs
  const cmsBlockTypes = ['text_block', 'quote_block', 'image', 'image_gallery', 'list_block', 'video_block', 'video', 'timeline', 'timeline_block', 'accordion', 'accordion_block', 'faq', 'quick_poll', 'poll', 'multi_question_poll']
  const isCmsBlock = block.blockKey && cmsBlockTypes.includes(block.blockKey.toLowerCase())
  
  console.log('[SectionContent] isCmsBlock:', isCmsBlock, 'blockKey:', block.blockKey, 'check:', block.blockKey ? cmsBlockTypes.includes(block.blockKey.toLowerCase()) : 'no blockKey')
  
  // Wenn CMS-Block, rendere mit CmsBlockRenderer
  if (isCmsBlock) {
    console.log('[SectionContent] Rendering as CMS Block')
    return <CmsBlockRenderer block={block} visualStyle={visualStyle} />
  }
  
  console.log('[SectionContent] Rendering as Template Block')
  
  // Template-basierter Block: Normale Field-Rendering
  // Sicherstellen, dass block.content.fields existiert
  if (!block.content || !block.content.fields) {
    console.warn('[SectionContent] Keine Felder für Block:', block.displayName, block)
    return (
      <div style={{ padding: '1rem', color: '#999', fontStyle: 'italic' }}>
        Keine Felder verfügbar
      </div>
    )
  }
  
  const allFields = Object.values(block.content.fields)
  console.log('[SectionContent] Block:', block.displayName, 'Alle Felder:', allFields.length)
  console.log('[SectionContent] Felder Details:', allFields.map(f => ({ 
    key: f.key, 
    type: f.type, 
    value: typeof f.value === 'string' ? f.value.substring(0, 50) : f.value,
    valueType: typeof f.value,
    hasValue: f.value !== null && f.value !== undefined && f.value !== ''
  })))
  
  const fields = allFields
    .filter(f => {
      // Filtere nur wirklich leere Werte
      // WICHTIG: Arrays und Objekte sollten auch durchgelassen werden
      if (Array.isArray(f.value)) {
        return f.value.length > 0
      }
      if (typeof f.value === 'object' && f.value !== null) {
        return Object.keys(f.value).length > 0
      }
      // Boolean-Werte sollten immer angezeigt werden
      if (typeof f.value === 'boolean') {
        return true
      }
      // Zahlen sollten angezeigt werden (auch 0)
      if (typeof f.value === 'number') {
        return true
      }
      const hasValue = f.value !== null && f.value !== undefined && f.value !== ''
      if (!hasValue) {
        console.log('[SectionContent] Filtering out field:', f.key, 'value:', f.value)
      }
      return hasValue
    })
  
  // Sortiere Felder nach Key
  const sortedFields = [...fields].sort((a, b) => {
    // Sortiere nach Field-Key (kann später durch Field.order erweitert werden)
    return a.key.localeCompare(b.key)
  })
  
  console.log('[SectionContent] Gefilterte Felder:', sortedFields.length, sortedFields.map(f => f.key))
  
  // Verwende sortedFields für weitere Verarbeitung
  const fieldsToRender = sortedFields
  
  // Trenne Media-Fields (Bilder, Videos) von normalen Fields
  const mediaFields = fieldsToRender.filter(f => {
    const type = (f.type || '').toLowerCase()
    const key = (f.key || '').toLowerCase()
    return (type.includes('image') || type === 'file-image') ||
           key.includes('image') ||
           key.includes('bild') ||
           key.includes('photo') ||
           key.includes('picture') ||
           key.includes('gallery')
  })
  
  const videoFields = fieldsToRender.filter(f => {
    const type = (f.type || '').toLowerCase()
    const key = (f.key || '').toLowerCase()
    return type.includes('video') || type === 'file-video' || key.includes('video')
  })
  
  // Dokument-Felder separat filtern (werden später mit Icon und Akzentfarbe gerendert)
  const documentFields = fieldsToRender.filter(f => {
    const type = (f.type || '').toLowerCase()
    const key = (f.key || '').toLowerCase()
    return type.includes('document') || type.includes('pdf') || key.includes('certificate') || key.includes('zertifikat')
  })
  
  const dataFields = fieldsToRender.filter(f => {
    const type = (f.type || '').toLowerCase()
    const key = (f.key || '').toLowerCase()
    // Filtere technische/UI-Felder, die nicht angezeigt werden sollen
    const isTechnicalField = key === 'alignment' || key === 'ausrichtung' || 
                            key === 'order' || key === 'status' ||
                            key === 'blockid' || key === 'fieldkey'
    const isDataField = !type.includes('image') && 
           type !== 'file-image' &&
           !type.includes('video') &&
           type !== 'file-video' &&
           !type.includes('document') &&
           !type.includes('pdf') &&
           !key.includes('image') &&
           !key.includes('bild') &&
           !key.includes('photo') &&
           !key.includes('picture') &&
           !key.includes('gallery') &&
           !key.includes('video') &&
           !key.includes('certificate') &&
           !key.includes('zertifikat') &&
           !isTechnicalField
    return isDataField
  })
  
  console.log('[SectionContent] Data Fields:', dataFields.length, 'Media Fields:', mediaFields.length, 'Video Fields:', videoFields.length, 'Document Fields:', documentFields.length)
  
  // Bestimme Layout basierend auf Variant
  const useGrid = variant !== 'minimal' && dataFields.length > 5
  
  return (
    <div>
      {/* Data Fields */}
      {dataFields.length > 0 && (
        <div
          style={{
            display: useGrid ? 'grid' : 'flex',
            gridTemplateColumns: useGrid ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
            flexDirection: useGrid ? undefined : 'column',
            gap: variant === 'minimal' ? '0.75rem' : editorialSpacing.md,
            marginBottom: mediaFields.length > 0 ? editorialSpacing.lg : 0,
          }}
        >
          {dataFields.map((field, fieldIndex) => {
            const isTextarea = field.type === 'textarea' || (typeof field.value === 'string' && field.value.length > 100)
            const isBoolean = field.type === 'boolean'
            const isNumber = field.type === 'number'
            const isSelect = field.type === 'select' || field.type === 'multi-select'
            const isUrl = field.type === 'url'
            const isDate = field.type === 'date'
            
            return (
              <div 
                key={field.key} 
                style={{ 
                  marginBottom: variant === 'spacious' ? '1.5rem' : '1rem',
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: editorialColors.text.secondaryVar,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {field.label}
                  </span>
                  <div
                    style={{
                      fontSize: isTextarea ? '0.9375rem' : '0.875rem',
                      color: editorialColors.text.primary,
                      lineHeight: isTextarea ? 1.7 : 1.5,
                      fontWeight: 400,
                    }}
                  >
                    {field.value === null || field.value === '' 
                      ? <span style={{ color: editorialColors.text.tertiary, fontStyle: 'italic' }}>Nicht angegeben</span>
                      : isBoolean 
                        ? (field.value === true || field.value === 'true' ? 'Ja' : 'Nein')
                        : isSelect && Array.isArray(field.value)
                          ? field.value.join(', ')
                          : String(field.value)
                    }
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Videos */}
      {videoFields.length > 0 && (
        <div style={{ marginTop: editorialSpacing.lg, marginBottom: editorialSpacing.lg }}>
          {videoFields.map((f, idx) => (
            <div key={idx} style={{ marginBottom: editorialSpacing.md }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: editorialColors.text.secondaryVar,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: editorialSpacing.sm,
              }}>
                {f.label}
              </div>
              <video
                src={f.value as string}
                controls
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  backgroundColor: editorialColors.background.secondary,
                }}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Media Gallery */}
      {mediaFields.length > 0 && (
        <MediaGallery 
          imageUrls={mediaFields
            .map(f => {
              // Wert kann komma-separierte URLs sein oder einzelne URL
              const value = f.value as string
              if (!value) return []
              // Split bei Komma (falls mehrere URLs)
              return value.includes(',') ? value.split(',').map(u => u.trim()) : [value]
            })
            .flat()
            .filter(url => url && url.length > 0)
          }
        />
      )}
      
      {/* Dokumente (PDFs) - Einheitlich mit Icon und Akzentfarbe - nach Media Gallery */}
      {documentFields.length > 0 && (
        <div style={{ 
          marginTop: editorialSpacing.lg,
          marginBottom: editorialSpacing.md,
        }}>
          {documentFields.map((f, idx) => (
            <a
              key={idx}
              href={f.value as string}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: editorialSpacing.sm,
                padding: `${editorialSpacing.sm} 0`,
                color: editorialColors.brand.accentVar,
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: idx < documentFields.length - 1 ? editorialSpacing.sm : 0,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {/* Dokument-Icon (grün/teal wie im Screenshot) */}
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{
                  flexShrink: 0,
                }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>{f.label}</span>
            </a>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {dataFields.length === 0 && mediaFields.length === 0 && videoFields.length === 0 && (
        <p
          style={{
            color: editorialColors.text.tertiary,
            fontStyle: 'italic',
            textAlign: 'center',
            padding: editorialSpacing.xl,
          }}
        >
          Keine Daten verfügbar
        </p>
      )}
    </div>
  )
}
