/**
 * Editorial Accent Component
 * 
 * Subtle emphasis elements: dividers, highlights, decorative elements.
 * Low visual weight, high semantic value.
 */

import React from 'react'
import { editorialColors } from './tokens/colors'
import { editorialSpacing } from './tokens/spacing'

type AccentType = 'divider' | 'highlight' | 'dot' | 'line'

interface AccentProps {
  type?: AccentType
  color?: string // Optional custom color override
  className?: string
  style?: React.CSSProperties
}

const ACCENT_STYLES: Record<AccentType, React.CSSProperties> = {
  divider: {
    height: '1px',
    backgroundColor: editorialColors.border.light,
    marginTop: editorialSpacing.xl,
    marginBottom: editorialSpacing.xl,
    border: 'none',
  },
  highlight: {
    height: '4px',
    width: '60px',
    backgroundColor: editorialColors.brand.accent,
    marginTop: editorialSpacing.md,
    marginBottom: editorialSpacing.md,
    border: 'none',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: editorialColors.brand.accent,
    display: 'inline-block',
    margin: `0 ${editorialSpacing.xs}`,
  },
  line: {
    width: '2px',
    height: '40px',
    backgroundColor: editorialColors.brand.accent,
    marginTop: editorialSpacing.md,
    marginBottom: editorialSpacing.md,
  },
}

export default function Accent({
  type = 'divider',
  color,
  className = '',
  style = {},
}: AccentProps) {
  const Tag = type === 'divider' ? 'hr' : 'div'
  
  // Use custom color if provided, otherwise use CSS variable, fallback to default
  const accentColor = color || (type === 'highlight' || type === 'dot' || type === 'line' 
    ? `var(--editorial-accent, ${editorialColors.brand.accent})`
    : undefined)

  return (
    <Tag
      className={`editorial-accent editorial-accent--${type} ${className}`}
      style={{
        ...ACCENT_STYLES[type],
        ...(accentColor && type !== 'divider' && { backgroundColor: accentColor }),
        ...style,
      }}
    />
  )
}

