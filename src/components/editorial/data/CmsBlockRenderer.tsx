/**
 * CMS Block Renderer
 * 
 * Rendert verschiedene CMS-Block-Typen (text_block, image_gallery, timeline, accordion, multi_question_poll, etc.)
 * Unterstützt den gesamten CMS-Baukasten
 */

"use client"

import React, { useState } from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import { editorialColors } from '../tokens/colors'
import { editorialSpacing } from '../tokens/spacing'
import Image from '../Media'
import { TextBlock, QuoteBlock, ListBlock } from '../Block'
import { ChevronDownIcon, ChevronUpIcon } from './SectionIcons'
import MultiQuestionPollRenderer from './MultiQuestionPollRenderer'
import ImageGallery from './ImageGallery'

interface CmsBlockRendererProps {
  block: UnifiedContentBlock
  visualStyle?: 'default' | 'accent' | 'background' | 'bordered'
  dppId?: string
}

export default function CmsBlockRenderer({ block, visualStyle = 'default', dppId }: CmsBlockRendererProps) {
  const blockType = block.blockKey // z.B. "text_block", "image_gallery", "timeline"
  const content = block.content?.fields || {}
  
  // Text Block
  if (blockType === 'text_block' || blockType === 'text') {
    const text = content.text?.value || content.content?.value || ''
    const alignment = content.alignment?.value || 'left'
    const textAlign = alignment === 'center' ? 'center' : alignment === 'right' ? 'right' : 'left'
    return (
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        paddingLeft: 'clamp(1rem, 4vw, 2rem)',
        paddingRight: 'clamp(1rem, 4vw, 2rem)',
        textAlign: textAlign as any,
      }}>
        <TextBlock size="base">
          {String(text)}
        </TextBlock>
      </div>
    )
  }
  
  // Quote Block
  if (blockType === 'quote_block' || blockType === 'quote') {
    const quote = content.quote?.value || content.text?.value || ''
    const attribution = content.author?.value || content.attribution?.value
    return (
      <QuoteBlock attribution={attribution ? String(attribution) : undefined}>
        {String(quote)}
      </QuoteBlock>
    )
  }
  
  // Image Gallery
  if (blockType === 'image_gallery' || blockType === 'gallery') {
    const images = content.images?.value || content.imageUrls?.value || []
    const rawUrls = Array.isArray(images)
      ? images
      : typeof images === 'string'
        ? images.split(',').map((url: string) => url.trim())
        : []
    const imageUrls: string[] = rawUrls.filter((u): u is string => typeof u === 'string' && u.length > 0)
    
    if (imageUrls.length === 0) return null
    
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: editorialSpacing.md,
        marginTop: editorialSpacing.md,
      }}>
        {imageUrls.map((url, index) => (
          <Image
            key={index}
            src={url}
            alt={`Bild ${index + 1}`}
            aspectRatio="16:9"
            priority={index < 3}
          />
        ))}
      </div>
    )
  }
  
  // List Block
  if (blockType === 'list_block' || blockType === 'list') {
    const items = content.items?.value || content.list?.value || []
    const listItems = Array.isArray(items) 
      ? items.map((item: any) => typeof item === 'string' ? item : (item?.text || item?.label || String(item)))
      : []
    const ordered = content.ordered?.value === true || content.ordered?.value === 'true'
    
    if (listItems.length === 0) return null
    
    return (
      <ListBlock items={listItems} ordered={ordered} />
    )
  }
  
  // Timeline Block
  if (blockType === 'timeline') {
    const events = content.events?.value || []
    if (!Array.isArray(events) || events.length === 0) return null
    
    return (
      <div style={{
        position: 'relative',
        paddingLeft: '2rem',
        marginTop: editorialSpacing.md,
      }}>
        {events.map((event: any, index: number) => (
          <div key={index} style={{
            position: 'relative',
            paddingBottom: editorialSpacing.lg,
            borderLeft: `2px solid ${editorialColors.border.light}`,
            paddingLeft: editorialSpacing.md,
            marginLeft: '-2rem',
          }}>
            <div style={{
              position: 'absolute',
              left: '-0.5rem',
              top: 0,
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              backgroundColor: editorialColors.brand.accent,
              border: `2px solid ${editorialColors.background.primary}`,
            }} />
            <div style={{
              fontSize: '0.75rem',
              color: editorialColors.text.secondary,
              marginBottom: '0.25rem',
            }}>
              {event.date || event.timestamp}
            </div>
            <div style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: editorialColors.text.primary,
              marginBottom: '0.25rem',
            }}>
              {event.title || event.label}
            </div>
            {event.description && (
              <div style={{
                fontSize: '0.875rem',
                color: editorialColors.text.secondary,
                lineHeight: 1.6,
              }}>
                {event.description}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }
  
  // Accordion Block
  if (blockType === 'accordion') {
    const items = content.items?.value || []
    if (!Array.isArray(items) || items.length === 0) return null
    
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0)
    
    return (
      <div style={{ marginTop: editorialSpacing.md }}>
        {items.map((item: any, index: number) => (
          <div key={index} style={{
            borderBottom: `1px solid ${editorialColors.border.light}`,
            marginBottom: editorialSpacing.sm,
          }}>
            <button
              type="button"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              style={{
                width: '100%',
                padding: editorialSpacing.md,
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: editorialColors.text.primary,
              }}>
                {item.question || item.title}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: editorialColors.text.secondary,
                transition: 'transform 0.2s ease',
                transform: expandedIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                {expandedIndex === index ? (
                  <ChevronUpIcon size={16} color={editorialColors.text.secondary} />
                ) : (
                  <ChevronDownIcon size={16} color={editorialColors.text.secondary} />
                )}
              </div>
            </button>
            {expandedIndex === index && (
              <div style={{
                padding: `0 ${editorialSpacing.md} ${editorialSpacing.md}`,
                fontSize: '0.875rem',
                color: editorialColors.text.secondary,
                lineHeight: 1.6,
              }}>
                {item.answer || item.content}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }
  
  // Multi-Question Poll (neue erweiterte Version)
  if (blockType === 'multi_question_poll') {
    // dppId kommt aus Props oder aus block.content.fields.dppId (vom CMS-Adapter gesetzt)
    const pollDppId = dppId || (block.content?.fields?.dppId?.value as string) || ''
    if (!pollDppId) {
      console.warn('[CmsBlockRenderer] Multi-Question Poll benötigt dppId. Block:', block.id, 'dppId prop:', dppId, 'fields:', block.content?.fields)
      return (
        <div style={{
          padding: editorialSpacing.md,
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          color: '#ff4444',
          borderRadius: '8px',
          fontSize: '0.875rem',
        }}>
          Fehler: DPP-ID fehlt für Umfrage
        </div>
      )
    }
    console.log('[CmsBlockRenderer] Rendering Multi-Question Poll mit dppId:', pollDppId)
    return <MultiQuestionPollRenderer block={block} dppId={pollDppId} />
  }
  
  // Legacy Quick Poll Block - Mit dunklem Hintergrund (wie in bisheriger public DPP view für Firmennamen)
  if (false) { // quick_poll removed - use multi_question_poll instead
    const question = content.question?.value || ''
    const optionsValue = content.options?.value
    // Ensure options is always an array
    let options: string[] = []
    if (optionsValue != null && Array.isArray(optionsValue)) {
      // TypeScript type guard: after Array.isArray(), optionsValue is definitely an array
      const arrayValue = optionsValue as unknown as unknown[]
      options = arrayValue.filter((opt: unknown): opt is string => typeof opt === 'string')
    }
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    
    if (!question || options.length === 0) return null
    
    return (
      <div style={{
        marginTop: editorialSpacing.md,
        padding: editorialSpacing.xl,
        backgroundColor: editorialColors.background.dark, // Einfacher dunkler Hintergrund ohne Muster
        borderRadius: '12px',
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: editorialColors.text.inverse,
          marginBottom: editorialSpacing.lg,
        }}>
          {String(question)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: editorialSpacing.md }}>
          {options.map((option: string, index: number) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedOption(option)}
              style={{
                padding: editorialSpacing.md,
                backgroundColor: selectedOption === option ? editorialColors.brand.accent : 'rgba(255, 255, 255, 0.1)',
                color: selectedOption === option ? editorialColors.text.inverse : editorialColors.text.inverse,
                border: `1px solid ${selectedOption === option ? editorialColors.brand.accent : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.9375rem',
                fontWeight: selectedOption === option ? 600 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {String(option)}
            </button>
          ))}
        </div>
      </div>
    )
  }
  
  // Image Block (einzelnes Bild oder Galerie mit Bildunterschrift)
  if (blockType === 'image') {
    const imageUrl = content.url?.value || ''
    const alt = content.alt?.value || ''
    const caption = content.caption?.value || ''
    const alignment = content.alignment?.value || 'center'
    
    // Prüfe ob es mehrere Bilder gibt (z.B. aus einem Array oder mehreren Uploads)
    // Für jetzt: Einzelnes Bild, aber vorbereitet für Galerie
    const images: Array<{ url: string; alt?: string; caption?: string }> = []
    
    if (imageUrl) {
      // Einzelnes Bild
      if (typeof imageUrl === 'string') {
        images.push({
          url: imageUrl,
          alt: alt ? String(alt) : undefined,
          caption: caption ? String(caption) : undefined
        })
      } else if (Array.isArray(imageUrl)) {
        // Mehrere Bilder (value kann string | number | Record<string, unknown> sein)
        imageUrl.forEach((url: unknown) => {
          images.push({
            url: String(url),
            alt: alt ? String(alt) : undefined,
            caption: caption ? String(caption) : undefined
          })
        })
      }
    }
    
    if (images.length === 0) return null
    
    // Für einzelnes Bild: Lightbox beim Klick
    // Für mehrere Bilder: Galerie mit Navigation
    if (images.length === 1) {
      const [image] = images
      const [lightboxOpen, setLightboxOpen] = useState(false)
      
      // Bestimme Text-Ausrichtung basierend auf alignment (nur für Caption)
      const textAlign = alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'center'
      const alignStyle = alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center'
      
      return (
        <>
          <div style={{
            marginTop: editorialSpacing.md,
            display: 'flex',
            flexDirection: 'column',
            alignItems: alignStyle,
          }}>
            <div
              style={{
                width: '100%',
                maxWidth: '800px',
                cursor: 'pointer',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onClick={() => setLightboxOpen(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.01)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Image
                src={image.url}
                alt={image.alt || 'Bild'}
                aspectRatio="16:9"
                priority
              />
            </div>
            {image.caption && (
              <div style={{
                fontSize: '0.875rem',
                color: editorialColors.text.secondary,
                fontStyle: 'italic',
                textAlign: textAlign as any,
                marginTop: editorialSpacing.xs,
                maxWidth: '800px',
                width: '100%',
              }}>
                {image.caption}
              </div>
            )}
          </div>
          
          {/* Lightbox für einzelnes Bild */}
          {lightboxOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
              }}
              onClick={() => {
                setLightboxOpen(false)
                document.body.style.overflow = ''
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxOpen(false)
                  document.body.style.overflow = ''
                }}
                style={{
                  position: 'absolute',
                  top: '2rem',
                  right: '2rem',
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Schließen"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div
                style={{
                  position: 'relative',
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={image.url}
                  alt={image.alt || 'Bild'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
                {image.caption && (
                  <div style={{
                    marginTop: '1rem',
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    textAlign: 'center',
                    maxWidth: '600px',
                  }}>
                    {image.caption}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )
    } else {
      // Mehrere Bilder: Galerie mit Navigation
      // Sicherstellen, dass alignment ein gültiger Wert ist
      const validAlignment = (alignment === 'left' || alignment === 'right' || alignment === 'center') 
        ? alignment 
        : 'center'
      return <ImageGallery images={images} alignment={validAlignment} />
    }
  }
  
  // Video Block
  if (blockType === 'video_block' || blockType === 'video') {
    const videoUrl = content.videoUrl?.value || content.url?.value
    const poster = content.poster?.value || content.thumbnail?.value
    
    if (!videoUrl) return null
    
    return (
      <div style={{ marginTop: editorialSpacing.md }}>
        <video
          src={String(videoUrl)}
          poster={poster ? String(poster) : undefined}
          controls
          style={{
            width: '100%',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
          }}
        />
      </div>
    )
  }
  
  // Default: Render als normale Fields
  return null
}
