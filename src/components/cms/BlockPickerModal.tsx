"use client"

/**
 * Block Picker Modal
 * 
 * Große Kacheln mit Icons im Projekt-Stil
 * Nur verfügbare Blöcke werden angezeigt
 */

import { useState } from "react"
import { BlockTypeKey } from "@/lib/cms/types"
import { BLOCK_TYPE_FEATURE_MAP } from "@/lib/cms/validation"
import { getAvailableTemplates, BlockTemplate } from "@/lib/cms/templates"

interface BlockPickerModalProps {
  availableFeatures: string[]
  onSelectBlock: (type: string) => void
  onClose: () => void
}

// SVG Icons im Projekt-Stil (viewBox 0 0 24 24, stroke currentColor, strokeWidth 2)
const BlockIcons: Record<BlockTypeKey, React.ReactNode> = {
  storytelling: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  multi_question_poll: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <circle cx="18" cy="10" r="2"/>
      <circle cx="12" cy="4" r="2"/>
      <circle cx="6" cy="14" r="2"/>
    </svg>
  ),
  image_text: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  text: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  image: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  video: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  accordion: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  timeline: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  template_block: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="9" y1="9" x2="21" y2="9"/>
    </svg>
  )
}

const BLOCK_TYPE_INFO: Record<BlockTypeKey, { name: string; description: string }> = {
  storytelling: {
    name: "Storytelling",
    description: "Erzählende Inhalte mit Text, Bildern und Abschnitten"
  },
  multi_question_poll: {
    name: "Umfrage",
    description: "Interaktive Umfrage mit bis zu 3 Fragen für Nutzer-Feedback"
  },
  image_text: {
    name: "Bild & Text",
    description: "Kombinierte Blöcke mit Bild und Text"
  },
  text: {
    name: "Text",
    description: "Einfacher Text-Block"
  },
  image: {
    name: "Bild",
    description: "Einzelnes Bild"
  },
  video: {
    name: "Video",
    description: "Video-Einbettung"
  },
  accordion: {
    name: "Akkordeon",
    description: "Ausklappbare Inhalte"
  },
  timeline: {
    name: "Timeline",
    description: "Zeitstrahl-Darstellung"
  },
  template_block: {
    name: "Template Block",
    description: "Legacy-Block aus Template-System"
  }
}

export default function BlockPickerModal({
  availableFeatures,
  onSelectBlock,
  onClose
}: BlockPickerModalProps) {
  // Get available block types
  // Bei leerem availableFeatures alle Blöcke anzeigen (Fail-open in Produktion/Trial), sonst nach Features filtern
  const availableBlockTypes = (Object.keys(BLOCK_TYPE_FEATURE_MAP) as BlockTypeKey[]).filter(type => {
    if (type === "template_block") return false
    if (availableFeatures.length === 0) return true
    const featureKey = BLOCK_TYPE_FEATURE_MAP[type]
    return availableFeatures.includes(featureKey)
  })
  
  // Debug: Log available features and block types (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log("[BlockPickerModal] availableFeatures:", availableFeatures)
    console.log("[BlockPickerModal] availableBlockTypes:", availableBlockTypes)
    console.log("[BlockPickerModal] interaction_blocks in features:", availableFeatures.includes("interaction_blocks"))
    console.log("[BlockPickerModal] BLOCK_TYPE_FEATURE_MAP:", BLOCK_TYPE_FEATURE_MAP)
  }

  const availableTemplates = getAvailableTemplates(availableFeatures)

  function handleSelectType(type: BlockTypeKey) {
    onSelectBlock(type)
    onClose()
  }

  function handleSelectTemplate(template: BlockTemplate) {
    onSelectBlock(template.type)
    onClose()
  }

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        padding: "2rem",
        overflow: "auto"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "calc(100vh - 4rem)",
          margin: "auto",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "1.5rem 2rem",
          borderBottom: "1px solid #E5E5E5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FFFFFF"
        }}>
          <div>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              Block hinzufügen
            </h2>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              margin: 0
            }}>
              Wählen Sie einen Block-Typ oder eine Vorlage
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem",
              color: "#7A7A7A",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#0A0A0A"
              e.currentTarget.style.backgroundColor = "#F5F5F5"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#7A7A7A"
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "2rem"
        }}>
          {availableBlockTypes.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "#7A7A7A"
            }}>
              <p style={{ marginBottom: "1rem" }}>Keine Blöcke verfügbar</p>
              <p style={{ fontSize: "0.875rem" }}>Upgrade erforderlich</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1.5rem"
            }}>
              {availableBlockTypes.map((type) => {
                const info = BLOCK_TYPE_INFO[type]
                // Skip if info is not available (should not happen, but safety check)
                if (!info) {
                  console.warn(`[BlockPickerModal] Missing info for block type: ${type}`)
                  return null
                }
                return (
                  <button
                    key={type}
                    onClick={() => handleSelectType(type)}
                    style={{
                      padding: "2rem 1.5rem",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E5E5",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                      width: "100%"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#24c598"
                      e.currentTarget.style.backgroundColor = "#F0FDF4"
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(36, 197, 152, 0.1)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E5E5E5"
                      e.currentTarget.style.backgroundColor = "#FFFFFF"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    <div style={{
                      color: "#24c598",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {BlockIcons[type]}
                    </div>
                    <div style={{ width: "100%" }}>
                      <h3 style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#0A0A0A",
                        marginBottom: "0.5rem"
                      }}>
                        {info.name}
                      </h3>
                      <p style={{
                        fontSize: "0.875rem",
                        color: "#7A7A7A",
                        lineHeight: "1.5",
                        margin: 0
                      }}>
                        {info.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
