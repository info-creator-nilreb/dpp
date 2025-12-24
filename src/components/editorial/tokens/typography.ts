/**
 * Editorial Design Tokens: Typography
 * 
 * Scale-based type system optimized for editorial reading
 */

export const editorialTypography = {
  // Font families
  fontFamily: {
    heading: 'system-ui, -apple-system, sans-serif',  // Can be replaced with custom brand font
    body: 'system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, monospace',
  },

  // Type scale (based on 16px base)
  fontSize: {
    xs: '0.75rem',    // 12px - captions, labels
    sm: '0.875rem',   // 14px - small text
    base: '1rem',     // 16px - body text
    lg: '1.125rem',   // 18px - large body
    xl: '1.25rem',    // 20px - subheadings
    '2xl': '1.5rem',  // 24px - h4
    '3xl': '1.875rem', // 30px - h3
    '4xl': '2.25rem', // 36px - h2
    '5xl': '3rem',    // 48px - h1 (display)
    '6xl': '3.75rem', // 60px - hero
  },

  // Line heights
  lineHeight: {
    tight: 1.2,       // Headings
    snug: 1.4,        // Subheadings
    normal: 1.6,      // Body text
    relaxed: 1.8,     // Long-form content
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',  // Uppercase headings
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

export type EditorialTypography = typeof editorialTypography

