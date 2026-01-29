/**
 * Headline Block Component
 * 
 * Große Überschrift (wenn kein Hero-Bild vorhanden)
 */

"use client"

import React from 'react'
import { editorialColors } from '../tokens/colors'

interface HeadlineBlockProps {
  text: string
  brandName?: string
}

export default function HeadlineBlock({ text, brandName }: HeadlineBlockProps) {
  return (
    <div>
      {brandName && (
        <p
          style={{
            fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
            color: editorialColors.text.secondary,
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
          color: editorialColors.text.primary,
          margin: 0,
        }}
      >
        {text}
      </h1>
    </div>
  )
}
