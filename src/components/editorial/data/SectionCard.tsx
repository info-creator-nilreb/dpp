/**
 * SectionCard – Editorial card container for data sections
 *
 * Replaces divider/accordion container style.
 * - background: color-background-section
 * - border-radius: radius-lg
 * - padding: spacing-lg
 * - no visible border, no heavy shadow
 */

"use client"

import React from 'react'
import { editorialTheme } from '../tokens/theme'
import { ChevronDownIcon } from './SectionIcons'
import { editorialColors } from '../tokens/colors'
import './section-card.css'

const { spacing, radius, typography, color } = editorialTheme

interface SectionCardProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  /** If true, content is always visible, no collapse */
  alwaysOpen?: boolean
  statusBadge?: React.ReactNode
}

export default function SectionCard({
  title,
  isExpanded,
  onToggle,
  children,
  alwaysOpen = false,
  statusBadge,
}: SectionCardProps) {
  return (
    <div
      className="section-card"
      style={{
        backgroundColor: color.backgroundSection,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: '24px',
        border: 'none',
        boxShadow: 'none',
      }}
    >
      <button
        type="button"
        onClick={alwaysOpen ? undefined : () => onToggle()}
        disabled={alwaysOpen}
        style={{
          width: '100%',
          padding: `${spacing.sm} 0`,
          minHeight: 44,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: alwaysOpen ? 'default' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          gap: spacing.sm,
          font: 'inherit',
        }}
        aria-expanded={isExpanded}
        aria-label={`${title || 'Abschnitt'} ${isExpanded ? 'einklappen' : 'erweitern'}`}
      >
        <h2
          style={{
            fontSize: typography.fontSizeSectionTitle,
            fontWeight: 500,
            color: color.textPrimary,
            margin: 0,
            fontFamily: typography.fontFamilyPrimary,
            letterSpacing: typography.letterSpacingSection,
            flex: 1,
          }}
        >
          {title || 'Abschnitt'}
        </h2>
        {statusBadge}
        {!alwaysOpen && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              opacity: 0.5,
              flexShrink: 0,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronDownIcon size={11} color={editorialColors.text.secondaryVar} />
          </div>
        )}
      </button>

      {(isExpanded || alwaysOpen) && (
        <div
          style={{
            paddingTop: spacing.lg,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
