/**
 * Headline Block Component
 * 
 * Große Überschrift mit Hersteller und Version (wenn kein Hero-Bild vorhanden)
 */

"use client"

import React from 'react'
import { editorialColors } from '../tokens/colors'

interface HeadlineBlockProps {
  text: string
  brandName?: string
  versionInfo?: {
    version: number
    createdAt: Date
  }
  /** Bei true: für Akzent-Hintergrund (z. B. ohne Hero) – helle Schrift */
  onAccentBackground?: boolean
}

export default function HeadlineBlock({ text, brandName, versionInfo, onAccentBackground = false }: HeadlineBlockProps) {
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

  const textColor = onAccentBackground ? editorialColors.text.inverse : editorialColors.text.primary
  const secondaryColor = onAccentBackground ? 'rgba(255, 255, 255, 0.9)' : editorialColors.text.secondaryVar

  return (
    <div style={{ textAlign: 'center' }}>
      {brandName && (
        <p
          style={{
            fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
            color: secondaryColor,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem',
          }}
        >
          {brandName}
        </p>
      )}
      <h1
        style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: textColor,
          margin: 0,
          marginBottom: versionInfo || !versionInfo ? '0.5rem' : 0,
        }}
      >
        {text}
      </h1>
      <p
        style={{
          fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
          color: secondaryColor,
          fontWeight: 400,
          margin: 0,
        }}
      >
        {versionInfo
          ? `Version ${versionInfo.version} • Veröffentlicht am ${formatDate(versionInfo.createdAt)}`
          : 'Entwurf • Noch nicht veröffentlicht'}
      </p>
    </div>
  )
}
