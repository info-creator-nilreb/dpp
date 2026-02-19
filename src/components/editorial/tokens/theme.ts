/**
 * Editorial Design Token System
 *
 * Single source of truth for the DPP public frontend.
 * Mobile-first, premium editorial aesthetic.
 *
 * DO NOT hardcode values in components – use these tokens.
 */

import { editorialColors } from './colors'

// ---------------------------------------------------------------------------
// SPACING (Mobile First)
// ---------------------------------------------------------------------------

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  /** Label zu Value bei KeyValueItem */
  labelToValue: '6px',
  /** Abstand zwischen KeyValue-Items */
  betweenKvItems: '28px',
} as const

// ---------------------------------------------------------------------------
// RADIUS
// ---------------------------------------------------------------------------

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  /** Basisdaten-Karten (SKU, GTIN, Herkunft) */
  basicDataCard: '14px',
} as const

// ---------------------------------------------------------------------------
// TYPOGRAPHY
// ---------------------------------------------------------------------------

export const typography = {
  fontFamilyPrimary: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSizeLabel: '12px',
  fontSizeBody: '16px',
  fontSizeValue: '18px',
  fontSizeSectionTitle: '16.5px',
  fontSizeImpact: '20px',
  letterSpacingLabel: '0.08em',
  letterSpacingSection: '0.015em',
  lineHeightBody: 1.55,
  fontWeightValue: 550,
  fontWeightImpact: 600,
} as const

// ---------------------------------------------------------------------------
// COLORS (from editorialColors, mapped to spec names)
// ---------------------------------------------------------------------------

export const color = {
  backgroundPage: '#FAFAFA',
  backgroundSection: '#F0F0F0',
  backgroundSubtle: '#FAFAFA',
  textPrimary: '#111111',
  textSecondary: '#6F6F6F',
  textLabel: '#777777',
  accent: editorialColors.brand.accentVar,
  accentSubtle: 'rgba(36, 197, 152, 0.12)',
  accentRaw: '#24c598',
  /** Accent at 85% intensity for subdued use */
  accent85: 'rgba(36, 197, 152, 0.85)',
} as const

// ---------------------------------------------------------------------------
// ELEVATION (minimal – no heavy shadows)
// ---------------------------------------------------------------------------

export const shadow = {
  subtle: '0 2px 8px rgba(0, 0, 0, 0.04)',
} as const

// ---------------------------------------------------------------------------
// EXPORT ALL
// ---------------------------------------------------------------------------

export const editorialTheme = {
  spacing,
  radius,
  typography,
  color,
  shadow,
} as const

export type EditorialTheme = typeof editorialTheme
