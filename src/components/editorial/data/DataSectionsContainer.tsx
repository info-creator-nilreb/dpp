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
  
  // Trenne Template-Blöcke (Pflichtdaten) von CMS-Blöcken (Mehrwertinformationen)
  const { templateBlocks, cmsBlocks } = useMemo(() => {
    const template: UnifiedContentBlock[] = []
    const cms: UnifiedContentBlock[] = []
    
    // Bekannte CMS-Block-Typen (aus BlockType.key)
    const cmsBlockTypes = ['text_block', 'quote_block', 'image', 'image_gallery', 'list_block', 'video_block', 'video', 'timeline', 'timeline_block', 'accordion', 'accordion_block', 'faq', 'quick_poll', 'poll', 'multi_question_poll']
    
    dataBlocks.forEach(block => {
      // CMS-Blöcke haben bekannte BlockType-Keys (wie "timeline", "accordion", etc.)
      const isCmsBlock = block.blockKey && cmsBlockTypes.includes(block.blockKey.toLowerCase())
      // Mehrwert-Bilder (blockKey "image") nur in der Galerie anzeigen, nicht hier – sonst doppelte Galerie
      const isImageBlock = block.blockKey?.toLowerCase() === 'image'
      console.log('[DataSectionsContainer] Block classification:', {
        id: block.id,
        blockKey: block.blockKey,
        displayName: block.displayName,
        isCmsBlock,
        isImageBlock,
        inList: block.blockKey ? cmsBlockTypes.includes(block.blockKey.toLowerCase()) : false
      })
      if (isCmsBlock && !isImageBlock) {
        cms.push(block)
      } else if (isImageBlock) {
        // Image-Blöcke werden in der zentralen Galerie (EditorialDppViewRedesign) gerendert, nicht hier
      } else {
        // Alles andere sind Template-Blöcke (Pflichtdaten)
        // Filtere leere Blöcke aus (außer Basisdaten)
        if (!isBlockEmpty(block)) {
          template.push(block)
        } else {
          console.log('[DataSectionsContainer] Filtering out empty block:', block.displayName)
        }
      }
    })
    
    return { templateBlocks: template, cmsBlocks: cms }
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
      {/* Mintfarbene Linie als Trenner zwischen Beschreibung und Akkordeon-Abschnitten - zentriert */}
      {/* WICHTIG: Diese Linie wird nur angezeigt, wenn KEIN StoryTextBlock vorhanden ist */}
      {/* (StoryTextBlock hat bereits eine mintfarbene Linie am Ende) */}
      {templateBlocks.length > 0 && !hasStoryText && (
        <div style={{
          marginTop: editorialSpacing.xl,
          marginBottom: editorialSpacing.xl, // Einheitlicher Abstand
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div
            style={{
              width: '60px',
              height: '2px',
              backgroundColor: editorialColors.brand.accentVar,
            }}
          />
        </div>
      )}
      
      {/* Pflichtdaten (Template-Blöcke) - Im Akkordion */}
      {templateBlocks.length > 0 && (
        <>
          {templateBlocks.map((block, index) => {
            const visualStyle = getVisualStyle(index, block)
            const isExpanded = expandedSections.has(block.id)
            console.log(`[DataSectionsContainer] Rendering Section ${index}:`, {
              id: block.id,
              name: block.displayName,
              isExpanded,
              fieldsCount: Object.keys(block.content?.fields || {}).length
            })
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
          })}
        </>
      )}
      
      {/* Mintfarbene Linie als Trenner zwischen Pflichtdaten und Mehrwertinformationen */}
      {templateBlocks.length > 0 && cmsBlocks.length > 0 && (
        <div style={{
          marginTop: editorialSpacing.xl,
          marginBottom: editorialSpacing.xl, // Einheitlicher Abstand
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div
            style={{
              width: '60px',
              height: '2px',
              backgroundColor: editorialColors.brand.accentVar,
            }}
          />
        </div>
      )}
      
      {/* Mehrwertinformationen (CMS-Blöcke) - Direkt gerendert, kein Akkordion */}
      {cmsBlocks.length > 0 && (
        <>
          {(() => {
            // Gruppiere aufeinanderfolgende Image-Blöcke zu einer Galerie
            const groupedBlocks: Array<UnifiedContentBlock | UnifiedContentBlock[]> = []
            let currentImageGroup: UnifiedContentBlock[] = []
            
            cmsBlocks.forEach((block, index) => {
              if (block.blockKey === 'image') {
                currentImageGroup.push(block)
                // Wenn letzter Block oder nächster Block ist kein Image, schließe Gruppe
                if (index === cmsBlocks.length - 1 || cmsBlocks[index + 1].blockKey !== 'image') {
                  if (currentImageGroup.length > 1) {
                    // Mehrere Image-Blöcke: Als Gruppe speichern
                    groupedBlocks.push([...currentImageGroup])
                  } else {
                    // Einzelner Image-Block: Normal rendern
                    groupedBlocks.push(currentImageGroup[0])
                  }
                  currentImageGroup = []
                }
              } else {
                // Wenn es eine offene Image-Gruppe gibt, schließe sie zuerst
                if (currentImageGroup.length > 0) {
                  if (currentImageGroup.length > 1) {
                    groupedBlocks.push([...currentImageGroup])
                  } else {
                    groupedBlocks.push(currentImageGroup[0])
                  }
                  currentImageGroup = []
                }
                // Normaler Block
                groupedBlocks.push(block)
              }
            })
            
            return groupedBlocks.map((blockOrGroup, index) => {
              if (Array.isArray(blockOrGroup)) {
                // Mehrere Image-Blöcke: Als Galerie rendern
                const images = blockOrGroup.map(block => {
                  const url = block.content?.fields?.url?.value || ''
                  const alt = block.content?.fields?.alt?.value || ''
                  const caption = block.content?.fields?.caption?.value || ''
                  return {
                    url: String(url),
                    alt: alt ? String(alt) : undefined,
                    caption: caption ? String(caption) : undefined
                  }
                }).filter(img => img.url)
                
                if (images.length === 0) return null
                
                return (
                  <div key={`image-group-${index}`} style={{ marginBottom: editorialSpacing.xl }}>
                    <ImageGallery images={images} alignment="center" />
                  </div>
                )
              } else {
                // Einzelner Block: Normal rendern
                return (
                  <CmsBlockDirect 
                    key={blockOrGroup.id} 
                    block={blockOrGroup} 
                    dppId={dppId} 
                  />
                )
              }
            })
          })()}
        </>
      )}
    </div>
  )
}
