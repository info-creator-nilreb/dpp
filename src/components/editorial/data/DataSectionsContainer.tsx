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
import './data-sections-container.css'

interface DataSectionsContainerProps {
  blocks: UnifiedContentBlock[]
  maxExpandedSections?: number
  hasStoryText?: boolean
  dppId?: string
}

export default function DataSectionsContainer({
  blocks,
  maxExpandedSections = 3,
  hasStoryText = false,
  dppId
}: DataSectionsContainerProps) {
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
  
  // State für expanded Sections (nur Template-Blöcke)
  // Initialisiere direkt mit den ersten 2 Blöcken
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    // Initialisiere mit leeren Set, wird in useEffect gesetzt
    return initial
  })
  const [lastExpanded, setLastExpanded] = useState<string[]>([])
  
  // Keine automatische Initialisierung - alle Blöcke starten collapsed
  // useEffect entfernt - Benutzer klappt manuell auf // Nur wenn templateBlocks.length sich ändert
  
  const handleToggle = useCallback((blockId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      
      if (next.has(blockId)) {
        // Collapse
        next.delete(blockId)
        setLastExpanded(prevOrder => prevOrder.filter(id => id !== blockId))
      } else {
        // Expand
        // Auto-Collapse älteste Section wenn max erreicht
        setLastExpanded(prevOrder => {
          if (next.size >= maxExpandedSections && prevOrder.length > 0) {
            const oldestId = prevOrder[0]
            next.delete(oldestId)
            return [...prevOrder.slice(1).filter(id => id !== blockId), blockId]
          }
          return [...prevOrder.filter(id => id !== blockId), blockId]
        })
        
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
  
  return (
    <div style={{ 
      maxWidth: '900px',
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: '0 clamp(1rem, 4vw, 2rem)', // Mobile: weniger Padding, Desktop: mehr
      textAlign: 'left', // Desktop: linksbündig
      paddingTop: hasStoryText ? 0 : editorialSpacing.xl, // Wenn StoryText vorhanden, kein zusätzlicher Abstand oben
      paddingBottom: editorialSpacing.xl,
    }}
    className="data-sections-container"
    >
      {/* Mintfarbene Linie als Trenner – nur wenn Blöcke vorhanden und kein StoryText */}
      {orderedBlocks.length > 0 && !hasStoryText && (
        <div style={{
          marginTop: editorialSpacing.xl,
          marginBottom: editorialSpacing.xl,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{ width: '60px', height: '2px', backgroundColor: editorialColors.brand.accentVar }} />
        </div>
      )}
      
      {/* Alle Blöcke in einer Reihenfolge (wie im Mehrwert-Tab): Template = Akkordion, CMS = direkt, Image = Galerie an Position */}
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
        return orderedBlocks.map((item) => {
          if (item.type === 'template') {
            const block = item.block
            const index = templateIndex++
            const visualStyle = getVisualStyle(index, block)
            const isExpanded = expandedSections.has(block.id)
            return (
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
          }
          const block = item.block
          if (block.blockKey?.toLowerCase() === 'image') {
            const images = blockToImages(block)
            if (images.length === 0) return null
            return (
              <div key={block.id} style={{ marginBottom: editorialSpacing.xl }}>
                <ImageGallery images={images} alignment="center" />
              </div>
            )
          }
          return <CmsBlockDirect key={block.id} block={block} dppId={dppId} />
        })
      })()}
    </div>
  )
}
