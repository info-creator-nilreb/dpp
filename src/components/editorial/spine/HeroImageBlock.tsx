/**
 * Hero Image Block Component
 * 
 * Vollbild Hero-Bild mit Overlay (Headline, Brand, Version-Info)
 */

"use client"

import React from 'react'
import Image from '../Media'
import { editorialColors } from '../tokens/colors'
import './hero-image.css'

interface HeroImageBlockProps {
  imageUrl: string
  headline: string
  brandName?: string
  versionInfo?: {
    version: number
    createdAt: Date
  }
}

export default function HeroImageBlock({
  imageUrl,
  headline,
  brandName,
  versionInfo
}: HeroImageBlockProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '500px' }}>
      {/* Logo wird hier nicht gerendert - wird in EditorialDppViewRedesign gerendert */}
      <Image
        src={imageUrl}
        alt={headline}
        aspectRatio="16:9"
        priority
        style={{
          height: '80vh', // Desktop: Erhöhte Höhe, damit Text auf dem Bild steht
          minHeight: '500px',
          objectFit: 'cover',
          width: '100%',
        }}
        className="hero-image-responsive"
      />
      
      {/* Schwarze Bildüberlagerung 80 % Transparenz für Kontrast zur Headline */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Overlay mit Headline, Brand, Version */}
      {/* WICHTIG: Overlay ist innerhalb des Bildes positioniert, damit Text immer im Bild bleibt */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2rem)',
          maxHeight: '100%', // Verhindert, dass Text über das Bild hinausragt
          overflow: 'hidden', // Verhindert Overflow
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end', // Text am unteren Rand
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: brandName ? '0.5rem' : versionInfo ? '0.5rem' : 0,
              letterSpacing: '-0.02em',
              color: editorialColors.text.inverse,
              wordWrap: 'break-word', // Verhindert Text-Overflow
              overflowWrap: 'break-word',
            }}
          >
            {headline}
          </h1>
          
          {/* Brand Name */}
          {brandName && (
            <p
              style={{
                fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                color: 'rgba(255, 255, 255, 0.9)',
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
          
          {/* Version: immer anzeigen (veröffentlicht oder Entwurf) */}
          <p
            style={{
              fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
              color: 'rgba(255, 255, 255, 0.7)',
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
  )
}
