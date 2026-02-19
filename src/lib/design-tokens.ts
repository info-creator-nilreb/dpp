/**
 * Design Tokens – Einzige Quelle für Farben, Abstände, Typografie
 * Pflicht für alle neuen Komponenten. Keine Hardcodings.
 *
 * Referenz: ui-parity/tokens.json, ui-parity/tokens.css
 * EXECUTION_RULES: Regel 11 (UI-Tokens)
 */

export const tokens = {
  colors: {
    brand: {
      primary: '#0A0A0A',
      secondary: '#7A7A7A',
      accent: '#24c598',
    },
    text: {
      primary: '#0A0A0A',
      secondary: '#7A7A7A',
      tertiary: '#9A9A9A',
      inverse: '#FFFFFF',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F5F5F5',
      dark: '#0A0A0A',
    },
    border: {
      light: '#E5E5E5',
      medium: '#CDCDCD',
      dark: '#7A7A7A',
    },
    semantic: {
      success: '#2E7D32',
      successBg: '#E8F5E9',
      successBorder: '#C8E6C9',
      error: '#C33',
      errorBg: '#FEE',
      errorBorder: '#FCC',
      info: '#2563EB',
    },
  },
  typography: {
    fontFamily: {
      heading: 'system-ui, -apple-system, sans-serif',
      body: 'system-ui, -apple-system, sans-serif',
      mono: 'ui-monospace, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
  },
} as const

/** Für CSS custom properties in style-Attributen */
export const cssVars = {
  brandAccent: 'var(--ui-brand-accent)',
  textPrimary: 'var(--ui-text-primary)',
  textSecondary: 'var(--ui-text-secondary)',
  borderMedium: 'var(--ui-border-medium)',
  radiusSm: 'var(--ui-radius-sm)',
  radiusLg: 'var(--ui-radius-lg)',
  spaceMd: 'var(--ui-space-md)',
  success: 'var(--ui-success)',
  successBg: 'var(--ui-success-bg)',
  error: 'var(--ui-error)',
  errorBg: 'var(--ui-error-bg)',
} as const
