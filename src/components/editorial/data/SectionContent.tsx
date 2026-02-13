/**
 * Section Content Component
 * 
 * Rendert Fields aus einem Unified Content Block
 * Mit visueller Abwechslung und verschiedenen Layouts
 */

"use client"

import React from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import { normalizeCo2EmissionsValue } from '@/lib/co2-emissions-types'
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
  const cmsBlockTypes = ['text_block', 'text', 'storytelling', 'quote_block', 'image', 'image_gallery', 'list_block', 'video_block', 'video', 'timeline', 'timeline_block', 'accordion', 'accordion_block', 'faq', 'quick_poll', 'poll', 'multi_question_poll']
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
  
  // Sortiere Felder nach Template-Reihenfolge (order), Fallback: Key
  const sortedFields = [...fields].sort((a, b) => {
    const orderA = (a as { order?: number }).order ?? 999
    const orderB = (b as { order?: number }).order ?? 999
    if (orderA !== orderB) return orderA - orderB
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
    const isTechnicalField = key === 'alignment' || key === 'ausrichtung' || 
                            key === 'order' || key === 'status' ||
                            key === 'blockid' || key === 'fieldkey' ||
                            key === 'description' || key === 'title'
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

  // Data + Dokument-Felder kombiniert in Template-Reihenfolge (behebt großen Abstand, konsistente Spacing)
  const dataAndDocumentFields = fieldsToRender.filter(f => 
    dataFields.includes(f) || documentFields.includes(f)
  )
  
  console.log('[SectionContent] Data Fields:', dataFields.length, 'Media Fields:', mediaFields.length, 'Video Fields:', videoFields.length, 'Document Fields:', documentFields.length)
  
  const useGrid = variant !== 'minimal' && dataAndDocumentFields.length > 5
  
  return (
    <div>
      {/* Data Fields + Dokumente inline (Template-Reihenfolge, einheitliches Spacing) */}
      {dataAndDocumentFields.length > 0 && (
        <div
          style={{
            display: useGrid ? 'grid' : 'flex',
            gridTemplateColumns: useGrid ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
            flexDirection: useGrid ? undefined : 'column',
            gap: variant === 'minimal' ? '0.75rem' : editorialSpacing.md,
            marginBottom: mediaFields.length > 0 ? editorialSpacing.lg : 0,
          }}
        >
          {dataAndDocumentFields.map((field, fieldIndex) => {
            const isDocument = documentFields.includes(field)
            const isTextarea = field.type === 'textarea' || (typeof field.value === 'string' && field.value.length > 100)
            const isBoolean = field.type === 'boolean'
            const isNumber = field.type === 'number'
            const isSelect = field.type === 'select' || field.type === 'multi-select'
            const isUrl = field.type === 'url'
            const isDate = field.type === 'date'
            const isCo2 = field.type === 'co2_emissions'
            const co2Display = isCo2 ? (() => {
              const co2 = normalizeCo2EmissionsValue(field.value)
              if (co2.value == null || (typeof co2.value === 'number' && Number.isNaN(co2.value))) return null
              return `${Number(co2.value).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg CO₂e`
            })() : undefined

            if (isDocument) {
              const raw = field.value
              let items: Array<{ url: string; displayName?: string }> = []
              if (Array.isArray(raw)) {
                items = raw.map((r: unknown) =>
                  r && typeof r === 'object' && 'url' in (r as object)
                    ? { url: (r as { url: string }).url, displayName: (r as { displayName?: string }).displayName }
                    : typeof r === 'string' ? { url: r } : { url: String(r) }
                ).filter((x): x is { url: string; displayName?: string } => !!x.url)
              } else if (raw && typeof raw === 'object' && 'url' in (raw as object)) {
                const obj = raw as { url: string; displayName?: string }
                items = [{ url: obj.url, displayName: obj.displayName }]
              } else if (typeof raw === 'string') {
                items = raw.includes(',')
                  ? raw.split(',').map(u => ({ url: u.trim() })).filter(x => x.url)
                  : [{ url: raw }]
              }
              return (
                <div key={field.key} style={{ marginBottom: variant === 'spacious' ? '1.5rem' : '1rem' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: editorialColors.text.secondaryVar,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {field.label}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.map((item, idx) => {
                      const displayName = item.displayName || field.label
                      const linkText = displayName ? `${displayName} ansehen` : 'Ansehen'
                      return (
                        <a
                          key={idx}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            backgroundColor: 'rgba(36, 197, 152, 0.08)',
                            border: `1px solid ${editorialColors.brand.accentVar}`,
                            borderRadius: '8px',
                            color: editorialColors.brand.accentVar,
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'background-color 0.2s, border-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(36, 197, 152, 0.12)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(36, 197, 152, 0.08)'
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          <span>{linkText}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )
            }

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
                  {!(field.key === 'description' || field.key === 'title') && (
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
                  )}
                  <div
                    style={{
                      fontSize: isTextarea ? '0.9375rem' : '0.875rem',
                      color: editorialColors.text.primary,
                      lineHeight: isTextarea ? 1.7 : 1.5,
                      fontWeight: 400,
                    }}
                  >
                    {isCo2
                      ? (co2Display ?? <span style={{ color: editorialColors.text.tertiary, fontStyle: 'italic' }}>Nicht angegeben</span>)
                      : field.value === null || field.value === '' 
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
      
      {/* Empty State */}
      {dataAndDocumentFields.length === 0 && mediaFields.length === 0 && videoFields.length === 0 && (
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
