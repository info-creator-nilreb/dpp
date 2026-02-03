/**
 * Story Text Block Component
 * 
 * Narrativer Textblock (max. 300 Wörter)
 */

"use client"

import React from 'react'
import { editorialColors } from '../tokens/colors'
import { editorialSpacing } from '../tokens/spacing'
import './story-text.css'

interface StoryTextBlockProps {
  text: string
  maxWords?: number
  basicData?: {
    sku?: string | null
    gtin?: string | null
    countryOfOrigin?: string | null
  }
}

export default function StoryTextBlock({ text, maxWords = 300, basicData }: StoryTextBlockProps) {
  // Kürze Text auf max. Wörter (falls nötig)
  const words = text.split(' ')
  const truncated = words.length > maxWords 
    ? words.slice(0, maxWords).join(' ') + '...'
    : text
  
  return (
    <div
      style={{
        fontSize: '1rem',
        lineHeight: 1.6,
        color: editorialColors.text.primary,
        maxWidth: '800px',
        margin: '0 auto',
        marginBottom: 0,
        textAlign: 'center',
      }}
    >
      {words.length > 150 ? (
        <div
          className="story-text-two-columns"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: editorialSpacing.lg,
            textAlign: 'center',
          }}
        >
          <div>{truncated}</div>
        </div>
      ) : (
        <div>{truncated}</div>
      )}
      
      {/* Mintfarbene Linie als Trenner - zentriert */}
      <div
        style={{
          width: '60px',
          height: '2px',
          backgroundColor: editorialColors.brand.accentVar,
          marginTop: editorialSpacing.xl,
          marginBottom: editorialSpacing.xl, // Einheitlicher Abstand zu DataSectionsContainer
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />
      
      {/* Basisdaten (SKU, GTIN, Herkunftsland) - wie in aktueller public DPP route */}
      {basicData && (basicData.sku || basicData.gtin || basicData.countryOfOrigin) && (
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          marginTop: editorialSpacing.xl,
          textAlign: 'center',
        }}>
          {basicData.sku && (
            <div>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: editorialColors.text.secondaryVar,
                marginBottom: '0.5rem',
              }}>
                SKU
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 500,
                color: editorialColors.text.primary,
              }}>
                {basicData.sku}
              </p>
            </div>
          )}
          
          {basicData.gtin && (
            <div>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: editorialColors.text.secondaryVar,
                marginBottom: '0.5rem',
              }}>
                GTIN/EAN
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 500,
                color: editorialColors.text.primary,
              }}>
                {basicData.gtin}
              </p>
            </div>
          )}
          
          {basicData.countryOfOrigin && (
            <div>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: editorialColors.text.secondaryVar,
                marginBottom: '0.5rem',
              }}>
                Herkunftsland
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 500,
                color: editorialColors.text.primary,
              }}>
                {basicData.countryOfOrigin}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
