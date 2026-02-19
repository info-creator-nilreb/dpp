/**
 * Data Section Component
 *
 * Wraps SectionCard with block-driven content.
 * Minimalist editorial style – accordion header is part of the card.
 */

"use client"

import React from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import SectionCard from './SectionCard'
import SectionContent from './SectionContent'

interface DataSectionProps {
  block: UnifiedContentBlock
  isExpanded: boolean
  onToggle: () => void
  maxExpandedSections?: number
  variant?: 'default' | 'minimal' | 'spacious'
  visualStyle?: 'default' | 'accent' | 'background' | 'bordered'
}

export default function DataSection({
  block,
  isExpanded,
  onToggle,
  variant = 'minimal',
  visualStyle = 'default'
}: DataSectionProps) {
  return (
    <SectionCard
      title={block.displayName}
      isExpanded={isExpanded}
      onToggle={onToggle}
      alwaysOpen={false}
    >
      <SectionContent block={block} variant={variant} visualStyle={visualStyle} />
    </SectionCard>
  )
}
