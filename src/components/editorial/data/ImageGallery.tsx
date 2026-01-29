/**
 * Image Gallery Component
 * 
 * Rendert eine Galerie von Bildern mit:
 * - Max 3 Thumbnails nebeneinander
 * - Pfeilnavigation für weitere Bilder
 * - Lightbox beim Klick auf ein Bild
 */

"use client"

import React, { useState, useEffect } from 'react'
import { editorialColors } from '../tokens/colors'
import { editorialSpacing } from '../tokens/spacing'
import Image from '../Media'

interface ImageItem {
  url: string
  alt?: string
  caption?: string
}

interface ImageGalleryProps {
  images: ImageItem[]
  alignment?: 'left' | 'center' | 'right'
}

export default function ImageGallery({ images, alignment = 'center' }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Max 3 Thumbnails sichtbar
  const maxVisible = 3
  const hasMore = images.length > maxVisible
  const visibleImages = images.slice(currentIndex, currentIndex + maxVisible)

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex + maxVisible < images.length

  function handlePrev() {
    if (canGoPrev) {
      setCurrentIndex(Math.max(0, currentIndex - 1))
    }
  }

  function handleNext() {
    if (canGoNext) {
      setCurrentIndex(Math.min(images.length - maxVisible, currentIndex + 1))
    }
  }

  function openLightbox(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
    // Verhindere Body-Scroll wenn Lightbox offen
    document.body.style.overflow = 'hidden'
  }

  function closeLightbox() {
    setLightboxOpen(false)
    document.body.style.overflow = ''
  }

  function handleLightboxPrev() {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  function handleLightboxNext() {
    setLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  // Keyboard-Navigation für Lightbox
  useEffect(() => {
    if (!lightboxOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowLeft') {
        handleLightboxPrev()
      } else if (e.key === 'ArrowRight') {
        handleLightboxNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, lightboxIndex, images.length])

  if (images.length === 0) return null

  // Bestimme Alignment
  const alignStyle = alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center'

  return (
    <>
      <div style={{
        marginTop: editorialSpacing.md,
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignStyle,
      }}>
        {/* Gallery Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
          display: 'flex',
          alignItems: 'center',
          gap: editorialSpacing.sm,
        }}>
          {/* Previous Button */}
          {hasMore && canGoPrev && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '-2.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                border: `1px solid ${editorialColors.border.light}`,
                backgroundColor: '#FFFFFF',
                color: editorialColors.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 1,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = editorialColors.brand.accent
                e.currentTarget.style.color = editorialColors.brand.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = editorialColors.border.light
                e.currentTarget.style.color = editorialColors.text.primary
              }}
              aria-label="Vorheriges Bild"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}

          {/* Images Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${visibleImages.length}, 1fr)`,
            gap: editorialSpacing.sm,
            width: '100%',
            flex: 1,
          }}>
            {visibleImages.map((image, index) => {
              const actualIndex = currentIndex + index
              return (
                <div
                  key={actualIndex}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onClick={() => openLightbox(actualIndex)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    backgroundColor: '#F5F5F5',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={image.url}
                      alt={image.alt || `Bild ${actualIndex + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  {image.caption && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                    }}>
                      {image.caption}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Next Button */}
          {hasMore && canGoNext && (
            <button
              type="button"
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '-2.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                border: `1px solid ${editorialColors.border.light}`,
                backgroundColor: '#FFFFFF',
                color: editorialColors.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 1,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = editorialColors.brand.accent
                e.currentTarget.style.color = editorialColors.brand.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = editorialColors.border.light
                e.currentTarget.style.color = editorialColors.text.primary
              }}
              aria-label="Nächstes Bild"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
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
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={closeLightbox}
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
              zIndex: 10000,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }}
            aria-label="Schließen"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleLightboxPrev()
              }}
              style={{
                position: 'absolute',
                left: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
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
                zIndex: 10000,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              }}
              aria-label="Vorheriges Bild"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}

          {/* Image Container */}
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
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt || `Bild ${lightboxIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            {images[lightboxIndex].caption && (
              <div style={{
                marginTop: '1rem',
                color: '#FFFFFF',
                fontSize: '1rem',
                textAlign: 'center',
                maxWidth: '600px',
              }}>
                {images[lightboxIndex].caption}
              </div>
            )}
            {images.length > 1 && (
              <div style={{
                marginTop: '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.875rem',
              }}>
                {lightboxIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleLightboxNext()
              }}
              style={{
                position: 'absolute',
                right: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
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
                zIndex: 10000,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              }}
              aria-label="Nächstes Bild"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  )
}
