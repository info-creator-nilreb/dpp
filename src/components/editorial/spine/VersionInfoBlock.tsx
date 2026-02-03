/**
 * Version Info Block Component
 * 
 * Zeigt Version und Veröffentlichungsdatum (wenn kein Hero-Overlay)
 */

"use client"

import React from 'react'
import { editorialColors } from '../tokens/colors'

interface VersionInfoBlockProps {
  version: number
  createdAt: Date
}

export default function VersionInfoBlock({ version, createdAt }: VersionInfoBlockProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  }
  
  return (
    <p
      style={{
        fontSize: '0.875rem',
        color: editorialColors.text.secondaryVar,
        fontWeight: 400,
        marginTop: '0.5rem',
      }}
    >
      Version {version} • Veröffentlicht am {formatDate(createdAt)}
    </p>
  )
}
