/**
 * Editorial Page Component
 * 
 * Root container for editorial DPP pages.
 * Handles global layout, typography, and spacing context.
 */

import React from 'react'
import { editorialTypography } from './tokens/typography'
import { editorialColors } from './tokens/colors'

interface PageProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function Page({ children, className = '', style = {} }: PageProps) {
  return (
    <div
      className={`editorial-page ${className}`}
      style={{
        fontFamily: editorialTypography.fontFamily.body,
        fontSize: editorialTypography.fontSize.base,
        lineHeight: editorialTypography.lineHeight.normal,
        color: editorialColors.text.primary,
        backgroundColor: editorialColors.background.primary,
        minHeight: '100vh',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

