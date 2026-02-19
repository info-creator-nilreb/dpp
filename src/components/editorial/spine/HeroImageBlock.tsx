/**
 * Hero Image Block Component
 * 
 * Vollbild Hero-Bild mit Overlay (Headline, Brand, Version-Info)
 */

"use client"

import React, { useState } from 'react'
import Image from '../Media'
import { editorialColors } from '../tokens/colors'
import './hero-image.css'

export interface HeroImageItem {
  url: string
  alt?: string
}

interface HeroImageBlockProps {
  imageUrl: string
  /** Alle Basisdaten-Bilder für Hero + Thumbnail-Strip. Wenn length > 1, wird unter dem Hero eine Thumbnail-Leiste angezeigt. */
  images?: HeroImageItem[]
  headline: string
  brandName?: string
  versionInfo?: {
    version: number
    createdAt: Date
  }
}

export default function HeroImageBlock({
  imageUrl,
  images,
  headline,
  brandName,
  versionInfo
}: HeroImageBlockProps) {
  const list = images && images.length > 1 ? images : [{ url: imageUrl, alt: headline }]
  const [selectedIndex, setSelectedIndex] = useState(0)
  const displayUrl = list[selectedIndex]?.url ?? imageUrl
  const displayAlt = list[selectedIndex]?.alt ?? headline

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  }
  
  return (
    <div style={{ width: '100%' }}>
      {/* Bild + Overlay: Lade-Hintergrund nur im Bildbereich */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: '#f5f5f5',
          overflow: 'hidden',
        }}
      >
        <Image
          src={displayUrl}
          alt={displayAlt}
          aspectRatio="16:9"
          priority
          style={{
            height: '80vh',
            minHeight: '500px',
            objectFit: 'cover',
            width: '100%',
            display: 'block',
            verticalAlign: 'bottom',
            marginBottom: 0,
          }}
          className="hero-image-responsive"
        />

        {/* Schwarze Bildüberlagerung für Kontrast zur Headline */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            pointerEvents: 'none',
          }}
        />

        {/* Overlay mit Headline, Brand, Version – zentriert, max-width 820px */}
      <div
        className="hero-overlay-container"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '820px',
          width: '100%',
          padding: 'clamp(2rem, 5vw, 3rem) 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div
          className="hero-overlay-inner"
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: brandName ? '0.75rem' : versionInfo ? '0.75rem' : 0,
              letterSpacing: '-0.02em',
              color: editorialColors.text.inverse,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {headline}
          </h1>
          
          {/* Brand Name (Subtitle) */}
          {brandName && (
            <p
              style={{
                fontSize: '14px',
                opacity: 0.85,
                color: editorialColors.text.inverse,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: versionInfo ? '0.5rem' : 0,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {brandName}
            </p>
          )}
          
          {/* Version (Draft hint bei Entwurf) */}
          <p
            style={{
              fontSize: '12px',
              opacity: 0.6,
              color: editorialColors.text.inverse,
              fontWeight: 400,
              letterSpacing: '0.02em',
              marginTop: '0.5rem',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {versionInfo
              ? `Version ${versionInfo.version} • Veröffentlicht am ${formatDate(versionInfo.createdAt)}`
              : 'Entwurf • Noch nicht veröffentlicht'}
          </p>
        </div>
      </div>
      </div>

      {/* Thumbnail-Strip unter dem Hero (weißer Hintergrund, quadratisch, Akzent-Rahmen bei aktiv) */}
      {images && images.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: 'clamp(0.75rem, 2vw, 1rem)',
            backgroundColor: 'rgb(250, 250, 250)',
          }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              aria-label={`Bild ${i + 1} anzeigen`}
              style={{
                flex: '0 0 auto',
                width: 'clamp(48px, 8vw, 64px)',
                height: 'clamp(48px, 8vw, 64px)',
                padding: 0,
                border: selectedIndex === i
                  ? `2px solid ${editorialColors.brand.accentVar}`
                  : '1px solid rgba(0,0,0,0.15)',
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'transparent',
              }}
            >
              <img
                src={img.url}
                alt={img.alt ?? `Bild ${i + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
