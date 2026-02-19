/**
 * Story Text Block Component
 *
 * Produktbeschreibung (narrativer Text) + Basisdaten (SKU, GTIN, Herkunftsland).
 * Neutral SectionCard style – Akzent nur via Mint-Indikator oder value in accent.
 * Mobile: horizontal scroll mit snap-to-card, partiell nächste Karte sichtbar.
 */

"use client"

import React from 'react'
import { editorialColors } from '../tokens/colors'
import { editorialSpacing } from '../tokens/spacing'
import { editorialTheme } from '../tokens/theme'
import { BREAKPOINTS } from '@/lib/breakpoints'
import './story-text.css'

const { spacing, radius, color } = editorialTheme

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
  if (trimmed.length !== 2) return trimmed
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
  const basicDataItems = hasBasicData
    ? TILES.filter((t) => t.value(basicData!) != null && t.value(basicData!) !== '')
    : []
  const basicDataCount = basicDataItems.length

  const textContent = (
    <div
      className="editorial-intro-text intro-text-column"
      style={{
        fontSize: editorialTheme.typography.fontSizeBody,
        lineHeight: editorialTheme.typography.lineHeightBody,
        color: color.textPrimary,
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
    </div>
  )

  const basicDataContent = hasBasicData && (
    <div
      className={`editorial-basisdaten-wrapper basic-data-column basic-data-count-${Math.min(basicDataCount, 6)}`}
    >
     <div className="editorial-basisdaten-tiles">

          {basicDataItems.map((tile) => {
            const val = tile.value(basicData!)
            if (val == null || val === '') return null
            const displayVal = tile.format ? tile.format(val) : val
            return (
              <div
                key={tile.key}
                className="basic-data-card"
                style={{
                  backgroundColor: 'transparent',
                  color: color.textPrimary,
                  padding: spacing.lg,
                  borderRadius: radius.basicDataCard,
                  textAlign: 'left',
                  boxSizing: 'border-box',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: spacing.sm,
                }}
              >
                {/* Kleiner Akzent-Indikator (85% Intensität, zurückhaltend) */}
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: color.accent85,
                    flexShrink: 0,
                    marginTop: '6px',
                  }}
                />
                <div>
                  <p
                    style={{
                      fontSize: '12px',
                      letterSpacing: '0.1em',
                      opacity: 0.8,
                      textTransform: 'uppercase',
                      margin: '0 0 0.25rem 0',
                      color: color.textLabel,
                    }}
                  >
                    {tile.label}
                  </p>
                  <p
                    style={{
                      fontSize: editorialTheme.typography.fontSizeValue,
                      fontWeight: 550,
                      lineHeight: 1.4,
                      margin: 0,
                      wordBreak: 'break-word',
                      color: color.textPrimary,
                    }}
                  >
                    {displayVal}
                  </p>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )

  return (
    <>
      {textContent}
      {basicDataContent}
      <style>{`
        @media (max-width: ${BREAKPOINTS.EDITORIAL_SLIDER_MAX}px) {
          .editorial-basisdaten-tiles {
            display: flex !important;
            flex-wrap: nowrap;
            overflow-x: auto;
            justify-content: flex-start;
            gap: ${spacing.md};
            padding-bottom: ${spacing.sm};
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x mandatory;
            scroll-padding: 0 ${spacing.md};
          }
          .editorial-basisdaten-tiles > div {
            flex: 0 0 85%;
            max-width: 280px;
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
          .editorial-basisdaten-tiles::after {
            content: '';
            flex: 0 0 1px;
            min-width: 1px;
          }
        }
      `}</style>
    </>
  )
}
