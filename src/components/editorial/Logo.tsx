/**
 * Logo Component
 * 
 * Kundenlogo-Platzierung (Top-Left). Wird nur gerendert, wenn eine gültige logoUrl übergeben wird.
 * Bei Fehler (z. B. entferntes Logo) keine Darstellung, kein Platzhalter, kein Console-Fehler.
 */

"use client"

import React, { useState } from 'react'

interface LogoProps {
  logoUrl?: string | null
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
  const [loadError, setLoadError] = useState(false)

  // Kein Logo: nichts rendern (kein Platzhalter, keine Fehlermeldung)
  if (!logoUrl || !logoUrl.trim() || loadError) {
    return null
  }

  const logoContent = (
    <div
      style={{
        position: 'absolute',
        top: 'clamp(16px, 2vw, 24px)',
        left: 'clamp(16px, 2vw, 24px)',
        zIndex: 10,
        width: 'clamp(100px, 12vw, 160px)',
        height: 'auto',
        pointerEvents: 'auto',
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
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          padding: '0.5rem',
          borderRadius: '4px',
        }}
        loading="eager"
        onError={() => setLoadError(true)}
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
