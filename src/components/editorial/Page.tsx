/**
 * Editorial Page Component
 * 
 * Root container for editorial DPP pages.
 * Handles global layout, typography, and spacing context.
 */

import React from 'react'
import { editorialTypography } from './tokens/typography'
import { editorialColors } from './tokens/colors'
import { StylingConfig } from "@/lib/cms/types"
import { resolveTheme } from "@/lib/cms/theme-resolver"

interface PageProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  styling?: StylingConfig | null
  /** Wenn false (z. B. in der Editor-Vorschau): keine minHeight 100vh, Inhalt bestimmt Höhe. Veröffentlichte Seite: true. */
  fillViewport?: boolean
}

export default function Page({ children, className = '', style = {}, styling, fillViewport = true }: PageProps) {
  // Resolve theme from styling config
  const theme = resolveTheme(styling || undefined)
  
  // Use custom colors from theme, fallback to defaults
  const primaryColor = theme.colors.primary || editorialColors.brand.primary
  const secondaryColor = theme.colors.secondary || editorialColors.brand.secondary
  const accentColor = theme.colors.accent || editorialColors.brand.accent
  
  // Use primary color for text, secondary for secondary text
  const textPrimary = primaryColor
  const textSecondary = secondaryColor || editorialColors.text.secondary
  
  return (
    <div
      className={`editorial-page ${className}`}
      style={{
        fontFamily: editorialTypography.fontFamily.body,
        fontSize: editorialTypography.fontSize.base,
        lineHeight: editorialTypography.lineHeight.normal,
        color: textPrimary,
        backgroundColor: editorialColors.background.primary,
        overflowX: 'hidden',
        ...(fillViewport ? { minHeight: '100vh' } : {}),
        // CSS Variables for global theme access
        '--editorial-primary': primaryColor,
        '--editorial-secondary': secondaryColor || editorialColors.brand.secondary,
        '--editorial-accent': accentColor,
        '--editorial-text-primary': textPrimary,
        '--editorial-text-secondary': textSecondary,
        ...style,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

