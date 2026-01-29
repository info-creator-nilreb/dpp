/**
 * Media Gallery Component
 * 
 * Bildergalerie mit responsive Grid-Layout
 */

"use client"

import React from 'react'
import Image from '../Media'
import { editorialSpacing } from '../tokens/spacing'
import './media-gallery.css'

interface MediaGalleryProps {
  imageUrls: string[]
  maxImages?: number
}

export default function MediaGallery({ imageUrls, maxImages = 10 }: MediaGalleryProps) {
  const imagesToShow = imageUrls.slice(0, maxImages)
  
  if (imagesToShow.length === 0) {
    return null
  }
  
  // Responsive Grid (CSS wird über style-Objekte gehandhabt)
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)', // Desktop: 3 Spalten
    gap: editorialSpacing.md,
    marginTop: editorialSpacing.lg,
  }
  
  return (
    <div
      style={gridStyle}
      className="media-gallery"
    >
      {imagesToShow.map((url, index) => (
        <Image
          key={index}
          src={url}
          alt={`Bild ${index + 1}`}
          aspectRatio="16:9"
          priority={index < 3} // Erste 3 Bilder mit Priority
        />
      ))}
    </div>
  )
}
