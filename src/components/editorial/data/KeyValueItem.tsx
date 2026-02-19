/**
 * KeyValueItem – Reusable Label + Value pair
 *
 * Mobile-first editorial style.
 * variant="impact" for CO2, high-emphasis values.
 */

"use client"

import React from 'react'
import { editorialTheme } from '../tokens/theme'
import { editorialColors } from '../tokens/colors'

const { spacing, typography, color } = editorialTheme

interface KeyValueItemProps {
  label?: string
  value: React.ReactNode
  variant?: 'default' | 'impact'
  /** Optional: show value in accent color instead of primary */
  accentValue?: boolean
}

export default function KeyValueItem({
  label,
  value,
  variant = 'default',
  accentValue = false,
}: KeyValueItemProps) {
  const isImpact = variant === 'impact'
  const showLabel = label != null && label !== ''

  return (
    <div className="kv-item" style={{ marginBottom: 0 }}>
      <div
        className="kv-label"
        style={{
          marginBottom: spacing.labelToValue,
        }}
      >
        {showLabel && (
          <span
            style={{
              fontSize: typography.fontSizeLabel,
              color: color.textLabel,
              letterSpacing: typography.letterSpacingLabel,
              textTransform: 'uppercase',
              fontFamily: typography.fontFamilyPrimary,
            }}
          >
            {label}
          </span>
        )}
      </div>
      <div
        className="kv-value"
        style={{
          fontSize: isImpact ? typography.fontSizeImpact : typography.fontSizeValue,
          fontWeight: isImpact ? typography.fontWeightImpact : typography.fontWeightValue,
          color: accentValue ? editorialColors.brand.accentVar : color.textPrimary,
          lineHeight: 1.4,
          fontFamily: typography.fontFamilyPrimary,
          textDecoration: 'none',
        }}
      >
        {value}
      </div>
    </div>
  )
}
