/**
 * Editorial Design Tokens: Colors
 * 
 * Brand-first color system supporting per-customer customization
 */

export const editorialColors = {
  // Brand colors (can be overridden per customer)
  brand: {
    primary: '#0A0A0A',      // Deep black for premium feel
    secondary: '#7A7A7A',    // Warm gray
    accent: '#24c598',       // Magenta accent (Easy Pass brand)
  },

  // Semantic colors
  text: {
    primary: '#0A0A0A',      // Main text
    secondary: '#7A7A7A',    // Supporting text
    tertiary: '#9A9A9A',     // Muted text
    inverse: '#FFFFFF',      // Text on dark backgrounds
  },

  // Backgrounds
  background: {
    primary: '#FFFFFF',      // Main background
    secondary: '#FAFAFA',    // Subtle background
    tertiary: '#F5F5F5',     // Section backgrounds
    dark: '#0A0A0A',         // Dark sections
  },

  // Borders and dividers
  border: {
    light: '#E5E5E5',
    medium: '#CDCDCD',
    dark: '#7A7A7A',
  },

  // Overlay for images/video
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
} as const

export type EditorialColors = typeof editorialColors

