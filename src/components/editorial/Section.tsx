/**
 * Editorial Section Component
 * 
 * Layout container with variants for different section types.
 * Handles responsive breakpoints and vertical rhythm.
 */

import React from 'react'
import { editorialSpacing } from './tokens/spacing'
import { editorialColors } from './tokens/colors'

type SectionVariant = 'full-bleed' | 'contained' | 'split'

interface SectionProps {
  children: React.ReactNode
  variant?: SectionVariant
  backgroundColor?: string
  className?: string
  style?: React.CSSProperties
}

const SECTION_STYLES: Record<SectionVariant, React.CSSProperties> = {
  'full-bleed': {
    width: '100%',
    paddingLeft: 0,
    paddingRight: 0,
  },
  'contained': {
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: editorialSpacing.md,
    paddingRight: editorialSpacing.md,
  },
  'split': {
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: editorialSpacing.md,
    paddingRight: editorialSpacing.md,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: editorialSpacing.xl,
    alignItems: 'center',
  },
}

export default function Section({
  children,
  variant = 'contained',
  backgroundColor,
  className = '',
  style = {},
}: SectionProps) {
  const baseStyle: React.CSSProperties = {
    paddingTop: editorialSpacing.section.normal,
    paddingBottom: editorialSpacing.section.normal,
    backgroundColor: backgroundColor || editorialColors.background.primary,
  }

  const variantStyle = SECTION_STYLES[variant]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .editorial-section--split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: ${editorialSpacing.xl};
          align-items: center;
        }
        @media (max-width: 768px) {
          .editorial-section--split {
            grid-template-columns: 1fr;
            gap: ${editorialSpacing.md};
          }
        }
      `}} />
      <section
        className={`editorial-section editorial-section--${variant} ${className}`}
        style={{
          ...baseStyle,
          ...variantStyle,
          ...style,
        }}
      >
        {children}
      </section>
    </>
  )
}

