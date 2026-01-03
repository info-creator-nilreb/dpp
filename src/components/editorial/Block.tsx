/**
 * Editorial Block Component
 * 
 * Content primitives for different block types.
 * Focused on content presentation, not layout.
 */

import React from 'react'
import { editorialTypography } from './tokens/typography'
import { editorialColors } from './tokens/colors'
import { editorialSpacing } from './tokens/spacing'

type BlockType = 'text' | 'quote' | 'list'

interface BlockProps {
  type?: BlockType
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

interface TextBlockProps {
  children: React.ReactNode
  size?: 'sm' | 'base' | 'lg'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  className?: string
  style?: React.CSSProperties
}

export function TextBlock({
  children,
  size = 'base',
  weight = 'normal',
  className = '',
  style = {},
}: TextBlockProps) {
  return (
    <div
      className={`editorial-block editorial-block--text editorial-block--${size} ${className}`}
      style={{
        fontSize: editorialTypography.fontSize[size],
        fontWeight: editorialTypography.fontWeight[weight],
        lineHeight: editorialTypography.lineHeight.normal,
        color: 'var(--editorial-text-primary, ' + editorialColors.text.primary + ')',
        marginBottom: editorialSpacing.md,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface QuoteBlockProps {
  children: React.ReactNode
  attribution?: string
  className?: string
  style?: React.CSSProperties
}

export function QuoteBlock({
  children,
  attribution,
  className = '',
  style = {},
}: QuoteBlockProps) {
  return (
    <blockquote
      className={`editorial-block editorial-block--quote ${className}`}
      style={{
        fontSize: editorialTypography.fontSize['2xl'],
        lineHeight: editorialTypography.lineHeight.relaxed,
        fontWeight: editorialTypography.fontWeight.medium,
        fontStyle: 'italic',
        color: 'var(--editorial-text-secondary, ' + editorialColors.text.secondary + ')',
        borderLeft: `4px solid var(--editorial-accent, ${editorialColors.brand.accent})`,
        paddingLeft: editorialSpacing.md,
        marginTop: editorialSpacing.xl,
        marginBottom: editorialSpacing.xl,
        ...style,
      }}
    >
      <p style={{ marginBottom: attribution ? editorialSpacing.sm : 0 }}>
        {children}
      </p>
      {attribution && (
        <cite
          style={{
            fontSize: editorialTypography.fontSize.sm,
            fontStyle: 'normal',
            color: editorialColors.text.tertiary,
            display: 'block',
            marginTop: editorialSpacing.xs,
          }}
        >
          — {attribution}
        </cite>
      )}
    </blockquote>
  )
}

interface ListBlockProps {
  items: string[]
  ordered?: boolean
  className?: string
  style?: React.CSSProperties
}

export function ListBlock({
  items,
  ordered = false,
  className = '',
  style = {},
}: ListBlockProps) {
  const ListTag = ordered ? 'ol' : 'ul'

  return (
    <ListTag
      className={`editorial-block editorial-block--list ${className}`}
      style={{
        fontSize: editorialTypography.fontSize.base,
        lineHeight: editorialTypography.lineHeight.relaxed,
        color: 'var(--editorial-text-primary, ' + editorialColors.text.primary + ')',
        paddingLeft: editorialSpacing.md,
        marginTop: editorialSpacing.md,
        marginBottom: editorialSpacing.md,
        ...style,
      }}
    >
      {items.map((item, index) => (
        <li
          key={index}
          style={{
            marginBottom: editorialSpacing.xs,
          }}
        >
          {item}
        </li>
      ))}
    </ListTag>
  )
}

// Main Block component (backwards compatible)
export default function Block({ type = 'text', children, className = '', style = {} }: BlockProps) {
  switch (type) {
    case 'text':
      return <TextBlock className={className} style={style}>{children}</TextBlock>
    case 'quote':
      return <QuoteBlock className={className} style={style}>{children}</QuoteBlock>
    default:
      return <TextBlock className={className} style={style}>{children}</TextBlock>
  }
}

