/**
 * Data Section Component
 * 
 * Minimalistische, einklappbare Section im Apple-Editorial-Style
 * Mit visueller Abwechslung durch Hintergründe und Akzentfarben
 */

"use client"

import React from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import { editorialColors } from '../tokens/colors'
import { editorialSpacing } from '../tokens/spacing'
import SectionContent from './SectionContent'
import { ChevronDownIcon, ChevronUpIcon } from './SectionIcons'
import './data-section.css'

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
  maxExpandedSections = 3,
  variant = 'minimal',
  visualStyle = 'default'
}: DataSectionProps) {
  // Einheitliche Header-Styles für alle Sections
  const headerStyle = {
    fontSize: '0.875rem',
    fontWeight: 400,
    color: editorialColors.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }
  
  // Visuelle Styles für Abwechslung (orientiert an edelweiss-Beispiel)
  const getVisualStyles = () => {
    switch (visualStyle) {
      case 'accent':
        return {
          padding: '1.5rem 0',
          borderBottom: `1px solid ${editorialColors.border.light}`,
          paddingLeft: '1.5rem',
          borderLeft: `2px solid ${editorialColors.brand.accent}`,
        }
      case 'background':
        return {
          padding: '1.5rem 1.25rem',
          backgroundColor: editorialColors.background.secondary,
          borderRadius: '4px',
        }
      case 'bordered':
        return {
          padding: '1.5rem 1.25rem',
          border: `1px solid ${editorialColors.border.light}`,
          borderRadius: '4px',
        }
      case 'default':
      default:
        return {
          padding: '1.5rem 0',
          borderBottom: `1px solid ${editorialColors.border.light}`,
        }
    }
  }
  
  const visualStyles = getVisualStyles()
  
  return (
    <div
      className="data-section-minimal"
      style={{
        width: '100%',
        marginBottom: visualStyle !== 'default' ? editorialSpacing.md : 0,
        ...visualStyles,
      }}
    >
      {/* Section Header - Einheitlich */}
      <button
        type="button"
        onClick={onToggle}
        className="data-section-header-minimal"
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          padding: 0,
          gap: '1rem',
        }}
        aria-expanded={isExpanded}
        aria-label={`${block.displayName} ${isExpanded ? 'einklappen' : 'erweitern'}`}
      >
        {/* Title - Einheitlich */}
        <h2
          style={{
            ...headerStyle,
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            flex: 1,
          }}
        >
          {block.displayName}
        </h2>
        
        {/* Chevron Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: editorialColors.text.secondary,
          transition: 'transform 0.2s ease',
        }}>
          {isExpanded ? (
            <ChevronUpIcon size={16} color={editorialColors.text.secondary} />
          ) : (
            <ChevronDownIcon size={16} color={editorialColors.text.secondary} />
          )}
        </div>
      </button>
      
      {/* Section Content (wenn expanded) */}
      {isExpanded && (
        <div
          className="data-section-content-minimal"
          style={{
            paddingTop: '1rem',
            paddingLeft: 0,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {console.log('[DataSection] Rendering content for:', block.displayName, 'Fields:', Object.keys(block.content?.fields || {}).length, 'isExpanded:', isExpanded)}
          {console.log('[DataSection] Block content:', block.content ? 'exists' : 'missing', 'fields:', block.content?.fields ? Object.keys(block.content.fields).length : 'missing')}
          <SectionContent block={block} variant={variant} visualStyle={visualStyle} />
        </div>
      )}
      {!isExpanded && console.log('[DataSection] NOT rendering content for:', block.displayName, 'isExpanded:', isExpanded)}
    </div>
  )
}
