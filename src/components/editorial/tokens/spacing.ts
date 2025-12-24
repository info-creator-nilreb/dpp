/**
 * Editorial Design Tokens: Spacing
 * 
 * 8px base unit system for consistent vertical rhythm
 */

export const editorialSpacing = {
  // Base unit: 8px
  xs: '0.5rem',    // 8px
  sm: '1rem',      // 16px
  md: '1.5rem',    // 24px
  lg: '2rem',      // 32px
  xl: '3rem',      // 48px
  '2xl': '4rem',   // 64px
  '3xl': '6rem',   // 96px
  '4xl': '8rem',   // 128px

  // Semantic spacing for sections
  section: {
    tight: '3rem',      // 48px - compact sections
    normal: '6rem',     // 96px - standard sections
    loose: '8rem',      // 128px - hero sections
  },
} as const

export type EditorialSpacing = typeof editorialSpacing

