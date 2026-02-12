/**
 * Story Text Block Component
 *
 * Produktbeschreibung (narrativer Text) + Basisdaten-Kacheln (außer Beschreibung):
 * Mobile: eine Zeile mit Akzent-Hintergrund, horizontal durchwischbar.
 * Desktop: Kacheln mittig zentriert, max. 4 pro Zeile.
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

/** ISO-3166-1 Alpha-2 zu ausgeschriebenem Ländernamen (deutsch) */
function formatCountryDisplay(value: string | null | undefined): string {
  if (value == null || value === '') return ''
  const trimmed = String(value).trim()
  if (trimmed.length !== 2) return trimmed // Bereits ausgeschrieben
  try {
    return new Intl.DisplayNames(['de'], { type: 'region' }).of(trimmed.toUpperCase()) ?? trimmed
  } catch {
    return trimmed
  }
}

const TILES = [
  { key: 'sku' as const, label: 'SKU', value: (d: StoryTextBlockProps['basicData']) => d?.sku, format: (v: string) => v },
  { key: 'gtin' as const, label: 'GTIN/EAN', value: (d: StoryTextBlockProps['basicData']) => d?.gtin, format: (v: string) => v },
  { key: 'countryOfOrigin' as const, label: 'Herkunftsland', value: (d: StoryTextBlockProps['basicData']) => d?.countryOfOrigin, format: formatCountryDisplay },
]

export default function StoryTextBlock({ text, maxWords = 300, basicData }: StoryTextBlockProps) {
  const words = text.split(' ')
  const truncated = words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : text
  const hasBasicData = basicData && TILES.some((t) => t.value(basicData) != null && t.value(basicData) !== '')

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
        <div className="story-text-two-columns" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: editorialSpacing.lg, textAlign: 'center' }}>
          <div>{truncated}</div>
        </div>
      ) : (
        <div>{truncated}</div>
      )}

      <div
        style={{
          width: '60px',
          height: '2px',
          backgroundColor: editorialColors.brand.accentVar,
          marginTop: editorialSpacing.xl,
          marginBottom: editorialSpacing.xl,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />

      {/* Basisdaten: mittig zentriert, Mobile = horizontal durchwischbar */}
      {hasBasicData && (
        <div
          className="editorial-basisdaten-tiles"
          style={{
            marginTop: editorialSpacing.xl,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
            maxWidth: '100%',
            width: '100%',
          }}
        >
          {TILES.map((tile) => {
            const val = tile.value(basicData!)
            if (val == null || val === '') return null
            const displayVal = tile.format ? tile.format(val) : val
            return (
              <div
                key={tile.key}
                style={{
                  backgroundColor: editorialColors.brand.accentVar,
                  color: 'rgba(255,255,255,0.95)',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  minWidth: '140px',
                }}
              >
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.35rem 0', opacity: 0.9 }}>
                  {tile.label}
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0, wordBreak: 'break-word' }}>{displayVal}</p>
              </div>
            )
          })}
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .editorial-basisdaten-tiles {
            display: flex !important;
            flex-wrap: nowrap;
            overflow-x: auto;
            justify-content: center;
            gap: 0.75rem;
            padding-bottom: 0.5rem;
            -webkit-overflow-scrolling: touch;
          }
          .editorial-basisdaten-tiles > div {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </div>
  )
}
