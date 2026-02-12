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

/** Plakative Darstellung: volle Breite, Akzent-Hintergrund, große Überschrift (für Text-Block, Storytelling ohne Bild) */
function StorytellingBlockPlakativ({
  heading,
  text,
  linkUrl,
  linkLabel,
  alignment = 'center',
}: {
  heading: string
  text: string
  linkUrl?: string
  linkLabel?: string
  /** Text- und Überschriften-Ausrichtung: left | center | right */
  alignment?: 'left' | 'center' | 'right'
}) {
  const hasContent = heading.trim().length > 0 || text.trim().length > 0
  if (!hasContent) return null
  const textAlign = alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'center'
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)',
        backgroundColor: editorialColors.brand.accentVar,
        textAlign,
        boxSizing: 'border-box',
      }}
    >
      {heading && (
        <h2
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.95)',
            margin: '0 0 1rem 0',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {heading}
        </h2>
      )}
      {text && (
        <p
          style={{
            fontSize: textSize,
            lineHeight: 1.7,
            color: 'rgba(255, 255, 255, 0.9)',
            margin: heading ? '0 0 1.25rem 0' : '0 0 1.25rem 0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            minWidth: 0,
          }}
        >
          {text}
        </p>
      )}
      {linkUrl && linkLabel && (
        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.95)' }}>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            {linkLabel}
          </a>
        </p>
      )}
    </div>
  )
}

/** Storytelling mit Bild: Editorial / Apple-Stil – Gradient-Overlay, starke Botschaft, keine schwere Box */
function StorytellingBlockWithImage({
  heading,
  text,
  imageUrl,
  linkUrl,
  linkLabel,
}: {
  heading: string
  text: string
  imageUrl: string
  linkUrl?: string
  linkLabel?: string
}) {
  const hasContent = heading.trim().length > 0 || text.trim().length > 0 || imageUrl
  if (!hasContent) return null
  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        minHeight: 'clamp(400px, 55vh, 600px)',
        overflow: 'visible',
      }}
    >
      {/* Hintergrundbild */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          role="presentation"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      )}
      {/* Editorial-Gradient: Dunkel links (für Lesbarkeit) → transparent rechts (Bild bleibt sichtbar) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 55%, transparent 85%)',
          pointerEvents: 'none',
        }}
      />
      {/* Text: Linksbündig, Botschaft im Fokus – wie Editorial Cover / Apple Product Pages */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          right: '28%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '100%',
            minWidth: 0,
            maxHeight: 'min(90vh, 480px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {heading && (
            <h2
              style={{
                fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '0 0 0.75rem 0',
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
                wordBreak: 'break-word',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {heading}
            </h2>
          )}
          {text && (
            <p
              style={{
                fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.95)',
                margin: heading ? '0 0 0.75rem 0' : '0 0 0.75rem 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
            >
              {text}
            </p>
          )}
          {linkUrl && linkLabel && (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.9)' }}>
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'inherit',
                  textDecoration: 'underline',
                  textDecorationThickness: '1px',
                  textUnderlineOffset: '2px',
                  fontWeight: 500,
                }}
              >
                {linkLabel}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface CmsBlockRendererProps {
  block: UnifiedContentBlock
  visualStyle?: 'default' | 'accent' | 'background' | 'bordered'
  dppId?: string
}

export default function CmsBlockRenderer({ block, visualStyle = 'default', dppId }: CmsBlockRendererProps) {
  const blockType = block.blockKey // z.B. "text_block", "image_gallery", "timeline"
  const content = block.content?.fields || {}
  
  // Storytelling Block: Mit Bild = Hintergrundbild + linke Hälfte 80 % Akzent-Overlay; ohne Bild = wie Text-Block
  if (blockType === 'storytelling') {
    const heading = content.title?.value != null ? String(content.title.value).trim() : ''
    const text = content.description?.value != null ? String(content.description.value).trim() : ''
    const linkUrl = content.linkUrl?.value ? String(content.linkUrl.value).trim() : undefined
    const linkLabel = content.linkLabel?.value ? String(content.linkLabel.value).trim() : undefined
    const images = content.images?.value
    const imageArray = Array.isArray(images) ? images : []
    const firstImage = imageArray[0]
    const imageUrl = typeof firstImage === 'object' && firstImage?.url
      ? String(firstImage.url)
      : typeof firstImage === 'string'
        ? firstImage
        : ''

    if (imageUrl) {
      return (
        <StorytellingBlockWithImage
          heading={heading}
          text={text}
          imageUrl={imageUrl}
          linkUrl={linkUrl || undefined}
          linkLabel={linkLabel || undefined}
        />
      )
    }
    return (
      <StorytellingBlockPlakativ
        heading={heading}
        text={text}
        linkUrl={linkUrl || undefined}
        linkLabel={linkLabel || undefined}
      />
    )
  }

  // Text Block: 1:1 wie Storytelling ohne Bild (volle Breite, Akzent-Hintergrund, Überschrift, Ausrichtung + Schriftgröße)
  if (blockType === 'text_block' || blockType === 'text') {
    const heading = content.heading?.value != null ? String(content.heading.value).trim() : ''
    const text = content.text?.value || content.content?.value || ''
    const alignmentRaw = content.alignment?.value
    const alignment = (alignmentRaw === 'left' || alignmentRaw === 'right' || alignmentRaw === 'center')
      ? alignmentRaw
      : 'center'
    const fontSizeRaw = content.fontSize?.value
    const fontSize = (fontSizeRaw === 'small' || fontSizeRaw === 'medium' || fontSizeRaw === 'large')
      ? fontSizeRaw
      : 'medium'
    return (
      <StorytellingBlockPlakativ
        heading={heading}
        text={String(text)}
        alignment={alignment}
        fontSize={fontSize}
      />
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
              backgroundColor: editorialColors.brand.accentVar,
              border: `2px solid ${editorialColors.background.primary}`,
            }} />
            <div style={{
              fontSize: '0.75rem',
              color: editorialColors.text.secondaryVar,
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
                color: editorialColors.text.secondaryVar,
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
                color: editorialColors.text.secondaryVar,
                transition: 'transform 0.2s ease',
                transform: expandedIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                {expandedIndex === index ? (
                  <ChevronUpIcon size={16} color={editorialColors.text.secondaryVar} />
                ) : (
                  <ChevronDownIcon size={16} color={editorialColors.text.secondaryVar} />
                )}
              </div>
            </button>
            {expandedIndex === index && (
              <div style={{
                padding: `0 ${editorialSpacing.md} ${editorialSpacing.md}`,
                fontSize: '0.875rem',
                color: editorialColors.text.secondaryVar,
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
                backgroundColor: selectedOption === option ? editorialColors.brand.accentVar : 'rgba(255, 255, 255, 0.1)',
                color: selectedOption === option ? editorialColors.text.inverse : editorialColors.text.inverse,
                border: `1px solid ${selectedOption === option ? editorialColors.brand.accentVar : 'rgba(255, 255, 255, 0.2)'}`,
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
                color: editorialColors.text.secondaryVar,
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
  
  // Video Block – YouTube/Vimeo als Embed, direkte URLs als <video>
  if (blockType === 'video_block' || blockType === 'video') {
    const rawUrl = content.videoUrl?.value || content.url?.value
    const poster = content.poster?.value || content.thumbnail?.value
    const autoplay = content.autoplay?.value === true || content.autoplay?.value === 'true'
    const loop = content.loop?.value === true || content.loop?.value === 'true'

    if (!rawUrl) return null

    const url = String(rawUrl).trim()

    // YouTube: watch oder youtu.be → Embed-URL
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      const videoId = ytMatch[1]
      const params = new URLSearchParams()
      if (autoplay) {
        params.set('autoplay', '1')
        params.set('mute', '1')
      }
      if (loop) {
        params.set('loop', '1')
        params.set('playlist', videoId)
      }
      const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '100%',
            marginTop: editorialSpacing.md,
            position: 'relative',
            aspectRatio: '16/9',
            minHeight: 360,
            overflow: 'hidden',
            borderRadius: '8px',
          }}
        >
          <iframe
            src={embedUrl}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      )
    }

    // Vimeo: vimeo.com/VIDEO_ID
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) {
      const videoId = vimeoMatch[1]
      const params = new URLSearchParams()
      if (autoplay) params.set('autoplay', '1')
      if (loop) params.set('loop', '1')
      const embedUrl = `https://player.vimeo.com/video/${videoId}?${params.toString()}`
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '100%',
            marginTop: editorialSpacing.md,
            position: 'relative',
            aspectRatio: '16/9',
            minHeight: 360,
            overflow: 'hidden',
            borderRadius: '8px',
          }}
        >
          <iframe
            src={embedUrl}
            title="Video"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      )
    }

    // Direkte Video-URL (mp4, webm etc.)
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          marginTop: editorialSpacing.md,
          minHeight: 360,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <video
          src={url}
          poster={poster ? String(poster) : undefined}
          controls
          autoPlay={autoplay}
          loop={loop}
          playsInline
          muted={autoplay}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 360,
            objectFit: 'cover',
          }}
        />
      </div>
    )
  }
  
  // Default: Render als normale Fields
  return null
}
