/**
 * Logo Component
 * 
 * Kundenlogo-Platzierung (Top-Left)
 */

"use client"

import React from 'react'
import { editorialSpacing } from './tokens/spacing'

interface LogoProps {
  logoUrl: string
  organizationName?: string
  organizationWebsite?: string
  className?: string
}

export default function Logo({
  logoUrl,
  organizationName,
  organizationWebsite,
  className = ''
}: LogoProps) {
  const logoContent = (
    <div
      style={{
        position: 'absolute',
        top: 'clamp(16px, 2vw, 24px)',
        left: 'clamp(16px, 2vw, 24px)',
        zIndex: 100, // Höherer z-index, damit Logo über allem liegt
        width: 'clamp(100px, 12vw, 160px)',
        height: 'auto',
        pointerEvents: 'auto', // Sicherstellen, dass Logo klickbar ist
      }}
      className={className}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={organizationName || 'Logo'}
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
          backgroundColor: 'rgba(255, 255, 255, 0.7)', // Leicht transparenter weißer Hintergrund
          padding: '0.5rem',
          borderRadius: '4px',
        }}
        loading="eager"
        onError={(e) => {
          // Fallback falls Bild nicht lädt
          console.error('Logo konnte nicht geladen werden:', logoUrl)
        }}
      />
    </div>
  )
  
  if (organizationWebsite) {
    return (
      <a
        href={organizationWebsite}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none' }}
      >
        {logoContent}
      </a>
    )
  }
  
  return logoContent
}
