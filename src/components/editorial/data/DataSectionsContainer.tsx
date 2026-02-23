/**
 * Data Sections Container
 * 
 * Container für alle Data Sections mit Expand/Collapse Management
 * Trennt Pflichtdaten (Template-Blöcke) von Mehrwertinformationen (CMS-Blöcke)
 * Nur Template-Blöcke sind im Akkordion, CMS-Blöcke werden direkt gerendert
 */

"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import DataSection from './DataSection'
import CmsBlockDirect from './CmsBlockDirect'
import ImageGallery from './ImageGallery'
import { editorialSpacing } from '../tokens/spacing'
import { editorialColors } from '../tokens/colors'
import { BREAKPOINTS_MQ } from '@/lib/breakpoints'
import './data-sections-container.css'

interface DataSectionsContainerProps {
  blocks: UnifiedContentBlock[]
  maxExpandedSections?: number
  hasStoryText?: boolean
  dppId?: string
  isPreview?: boolean
}

export default function DataSectionsContainer({
  blocks,
  maxExpandedSections: maxExpandedProp = 3,
  hasStoryText = false,
  dppId,
  isPreview = false
}: DataSectionsContainerProps) {
  // Mobile: only ONE section expanded at a time
  const [isMobile, setIsMobile] = useState(false)
  const [isDesktopNav, setIsDesktopNav] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.appMobile)
    setIsMobile(mq.matches)
    const h = () => setIsMobile(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.desktopNav)
    setIsDesktopNav(mq.matches)
    const h = () => setIsDesktopNav(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const maxExpandedSections = isMobile ? 1 : maxExpandedProp
  // Filter nur Data-Blöcke
  const dataBlocks = blocks
    .filter(b => b.presentation.layer === "data")
    .sort((a, b) => a.order - b.order)
  
  // Hilfsfunktion: Prüft ob ein Block leer ist (keine Felder mit Werten)
  const isBlockEmpty = (block: UnifiedContentBlock): boolean => {
    // Basisdaten (Basis- & Produktdaten) sollten immer angezeigt werden
    const isBasicData = block.displayName === 'Basis- & Produktdaten' || block.order === 0
    if (isBasicData) {
      return false // Immer anzeigen
    }
    
    // Prüfe ob Block Felder hat
    if (!block.content || !block.content.fields) {
      return true // Keine Felder = leer
    }
    
    const fields = Object.values(block.content.fields)
    if (fields.length === 0) {
      return true // Keine Felder = leer
    }
    
    // Prüfe ob mindestens ein Feld einen Wert hat
    const hasContent = fields.some(f => {
      // Arrays: mindestens ein Element
      if (Array.isArray(f.value)) {
        return f.value.length > 0
      }
      // Objekte: mindestens eine Property
      if (typeof f.value === 'object' && f.value !== null) {
        return Object.keys(f.value).length > 0
      }
      // Boolean: immer anzeigen
      if (typeof f.value === 'boolean') {
        return true
      }
      // Zahlen: immer anzeigen (auch 0)
      if (typeof f.value === 'number') {
        return true
      }
      // Strings: nicht leer
      return f.value !== null && f.value !== undefined && String(f.value).trim().length > 0
    })
    
    return !hasContent // Block ist leer wenn kein Feld einen Wert hat
  }
  
  // Eine gemeinsame, nach order sortierte Liste: Template- und CMS-Blöcke gemischt, damit Position = Mehrwert-Tab
  const cmsBlockTypes = ['text_block', 'text', 'storytelling', 'quote_block', 'image', 'image_gallery', 'list_block', 'video_block', 'video', 'timeline', 'timeline_block', 'accordion', 'accordion_block', 'faq', 'quick_poll', 'poll', 'multi_question_poll']
  
  const { templateBlocks, orderedBlocks } = useMemo(() => {
    const template: UnifiedContentBlock[] = []
    const cmsBlocks: UnifiedContentBlock[] = []
    
    dataBlocks.forEach(block => {
      const isCmsBlock = block.blockKey && cmsBlockTypes.includes(block.blockKey.toLowerCase())
      const isRedundantBasisdaten =
        block.displayName === 'Basis- & Produktdaten' ||
        (block.order === 1 && /basis|produktdaten/i.test(block.displayName || ''))
      
      if (isCmsBlock) {
        cmsBlocks.push(block)
      } else if (!isRedundantBasisdaten) {
        if (!isBlockEmpty(block)) {
          template.push(block)
        }
      }
    })
    
    // Pflichtangaben (Template-Blöcke) zuerst, dann Mehrwert-Blöcke (CMS-Blöcke) – CMS exakt wie im Mehrwert-Tab
    const cmsSorted = [...cmsBlocks].sort((a, b) => a.order - b.order)
    const ordered: Array<{ type: 'template' | 'cms'; block: UnifiedContentBlock }> = [
      ...template.map(block => ({ type: 'template' as const, block })),
      ...cmsSorted.map(block => ({ type: 'cms' as const, block })),
    ]
    
    return { templateBlocks: template, orderedBlocks: ordered }
  }, [dataBlocks])
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set())
  const lastExpandedRef = React.useRef<string[]>([])

  const handleToggle = useCallback((blockId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      const lastOrder = lastExpandedRef.current

      if (next.has(blockId)) {
        next.delete(blockId)
        lastExpandedRef.current = lastOrder.filter(id => id !== blockId)
      } else {
        if (next.size >= maxExpandedSections && lastOrder.length > 0) {
          const oldestId = lastOrder[0]
          next.delete(oldestId)
          lastExpandedRef.current = [...lastOrder.slice(1).filter(id => id !== blockId), blockId]
        } else {
          lastExpandedRef.current = [...lastOrder.filter(id => id !== blockId), blockId]
        }
        next.add(blockId)
      }
      return next
    })
  }, [maxExpandedSections])
  
  // Bestimme visuellen Style für Template-Sections - Einheitlich: alle mit default (nur border-bottom)
  // Optional: erste 2 mit accent (Mint-Balken) für visuelle Hervorhebung
  const getVisualStyle = (index: number, block: UnifiedContentBlock): 'default' | 'accent' | 'background' | 'bordered' => {
    // Alle Sections einheitlich: default (nur border-bottom, kein Hintergrund, kein Mint-Balken)
    // Oder: Erste 2 mit accent (Mint-Balken), Rest default
    // Für Einheitlichkeit: alle default
    return 'default'
  }
  
  // Alle Sections haben einheitliche Header-Styles
  const getVariantForBlock = (): 'minimal' => 'minimal'
  
  const showStickyNavPlaceholder = isDesktopNav && templateBlocks.length > 5

  const isFullbleedBlock = (block: UnifiedContentBlock) =>
    block.blockKey === 'storytelling' || block.blockKey === 'text_block' || block.blockKey === 'text'

  const containedStyle = {
    maxWidth: '900px' as const,
    marginLeft: 'auto' as const,
    marginRight: 'auto' as const,
    padding: '0 clamp(1rem, 4vw, 2rem)' as const,
  }

  return (
    <div
      className={`data-sections-container ${showStickyNavPlaceholder ? 'data-sections-with-nav' : ''}`}
      style={{
        maxWidth: showStickyNavPlaceholder ? undefined : 'none',
        marginLeft: showStickyNavPlaceholder ? undefined : 0,
        marginRight: showStickyNavPlaceholder ? undefined : 0,
        padding: 0,
        textAlign: 'left',
        paddingTop: hasStoryText ? 0 : editorialSpacing.introToData,
        paddingBottom: editorialSpacing.xl,
      }}
    >
      {showStickyNavPlaceholder && (
        <div className="data-sections-nav-placeholder" aria-hidden />
      )}
      <div className={showStickyNavPlaceholder ? 'data-sections-content' : undefined} style={showStickyNavPlaceholder ? { maxWidth: '900px' } : undefined}>
      {/* Mintfarbene Linie als Trenner – nur wenn Blöcke vorhanden und kein StoryText */}
      {orderedBlocks.length > 0 && !hasStoryText && (
        <div
          style={
            showStickyNavPlaceholder
              ? { marginTop: editorialSpacing.introToData, marginBottom: editorialSpacing.introToData, display: 'flex', justifyContent: 'center' }
              : { ...containedStyle, marginTop: editorialSpacing.introToData, marginBottom: editorialSpacing.introToData, display: 'flex', justifyContent: 'center' }
          }
        >
          <div style={{ width: '60px', height: '2px', backgroundColor: editorialColors.brand.accentVar }} />
        </div>
      )}

      {/* Alle Blöcke in Reihenfolge: Fullbleed (Storytelling, Text) = volle Breite wie Hero, Rest = max-width 900px */}
      {orderedBlocks.length > 0 && (() => {
        const blockToImages = (block: UnifiedContentBlock): Array<{ url: string; alt?: string; caption?: string }> => {
          const urlVal = block.content?.fields?.url?.value
          const alt = block.content?.fields?.alt?.value
          const caption = block.content?.fields?.caption?.value
          const urls = Array.isArray(urlVal) ? urlVal : (urlVal ? [urlVal] : [])
          return urls
            .filter((u): u is string => typeof u === 'string' && u.length > 0)
            .map(url => ({
              url: String(url),
              alt: alt != null && String(alt).trim() ? String(alt) : undefined,
              caption: caption != null && String(caption).trim() ? String(caption) : undefined
            }))
        }
        let templateIndex = 0
        let seenFirstCms = false
        return orderedBlocks.map((item) => {
          if (item.type === 'template') {
            const block = item.block
            const index = templateIndex++
            const visualStyle = getVisualStyle(index, block)
            const isExpanded = expandedSections.has(block.id)
            const content = (
              <DataSection
                key={block.id}
                block={block}
                isExpanded={isExpanded}
                onToggle={() => handleToggle(block.id)}
                maxExpandedSections={maxExpandedSections}
                variant={getVariantForBlock()}
                visualStyle={visualStyle}
              />
            )
            return showStickyNavPlaceholder ? content : <div key={block.id} style={containedStyle}>{content}</div>
          }
          const block = item.block
          const isFirstCms = !seenFirstCms
          if (isFirstCms) seenFirstCms = true
          if (block.blockKey?.toLowerCase() === 'image') {
            const images = blockToImages(block)
            if (images.length === 0) return null
            const content = (
              <div
                key={block.id}
                className="mehrwert-module"
                style={{
                  marginBottom: editorialSpacing.betweenSections,
                  marginTop: isFirstCms ? editorialSpacing.beforeMehrwert : undefined,
                }}
              >
                <ImageGallery images={images} alignment="center" />
              </div>
            )
            return showStickyNavPlaceholder ? content : <div key={block.id} style={containedStyle}>{content}</div>
          }
          const content = (
            <div
              key={block.id}
              className="mehrwert-module"
              style={{
                marginTop: isFirstCms ? editorialSpacing.beforeMehrwert : undefined,
                marginBottom: editorialSpacing.betweenSections,
              }}
            >
              <CmsBlockDirect block={block} dppId={dppId} isPreview={isPreview} />
            </div>
          )
          if (isFullbleedBlock(block)) {
            return <div key={block.id} className="mehrwert-module--fullbleed">{content}</div>
          }
          return showStickyNavPlaceholder ? content : <div key={block.id} style={containedStyle}>{content}</div>
        })
      })()}
      </div>
    </div>
  )
}
