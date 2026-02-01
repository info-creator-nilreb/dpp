"use client"

/**
 * Content Block Card
 * 
 * Schlanke, über gesamte Breite gehende Kacheln
 * - Inline editing
 * - Medienupload integriert
 * - Ähnlich wie Pflichtangaben-Kacheln
 */

import { useState } from "react"
import { Block, BlockTypeKey } from "@/lib/cms/types"
import ContentBlockEditor from "./ContentBlockEditor"
import FileUploadArea from "@/components/FileUploadArea"

const BLOCK_TYPE_LABELS: Record<BlockTypeKey, string> = {
  storytelling: "Storytelling",
  multi_question_poll: "Umfrage",
  image_text: "Bild & Text",
  text: "Text",
  image: "Bild",
  video: "Video",
  accordion: "Akkordeon",
  timeline: "Timeline",
  template_block: "Template-Block"
}

// SVG Icons im Projekt-Stil
const BlockIcons: Record<BlockTypeKey, React.ReactNode> = {
  multi_question_poll: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <circle cx="18" cy="10" r="2"/>
      <circle cx="12" cy="4" r="2"/>
      <circle cx="6" cy="14" r="2"/>
    </svg>
  ),
  storytelling: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  image_text: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  text: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  video: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  accordion: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  timeline: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  template_block: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="9" y1="9" x2="21" y2="9"/>
    </svg>
  )
}

interface ContentBlockCardProps {
  block: Block
  isSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
  dppId: string
}

export default function ContentBlockCard({
  block,
  isSelected,
  isDragging,
  onSelect,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  dppId
}: ContentBlockCardProps) {
  // Neuer Block (kein Content) -> direkt in Edit-Modus
  const isEmpty = !block.content || Object.keys(block.content).length === 0
  const [isEditing, setIsEditing] = useState(isEmpty)
  const [isHovered, setIsHovered] = useState(false)

  // Wenn Block gerade erstellt wurde, direkt in Edit-Modus
  if (isEditing) {
    return (
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        overflow: "hidden",
        width: "100%"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "#F9F9F9",
          borderBottom: "1px solid #E5E5E5",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "6px",
              color: "#24c598"
            }}>
              {BlockIcons[block.type]}
            </div>
            <div>
              <h4 style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#0A0A0A",
                margin: 0
              }}>
                {BLOCK_TYPE_LABELS[block.type]} bearbeiten
              </h4>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              padding: "0.5rem",
              color: "#7A7A7A",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#0A0A0A"
              e.currentTarget.style.backgroundColor = "#F5F5F5"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#7A7A7A"
              e.currentTarget.style.backgroundColor = "transparent"
            }}
            title="Editor schließen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        </div>

        {/* Editor Content */}
        <div style={{ padding: "1.5rem" }}>
          <ContentBlockEditor
            block={block}
            onUpdate={(updates) => {
              onUpdate(updates)
              // Don't close editor on update - auto-save handles saving
              // Editor stays open for continuous editing
            }}
            dppId={dppId}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: "#FFFFFF",
        border: isSelected ? "1px solid #24c598" : "1px solid #E5E5E5",
        borderRadius: "12px",
        overflow: "hidden",
        width: "100%",
        cursor: isEditing ? "default" : "pointer",
        transition: "all 0.2s",
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isSelected ? "0 4px 12px rgba(226, 0, 116, 0.1)" : "none"
      }}
      onClick={isEditing ? undefined : onSelect}
    >
      {/* Header - ähnlich wie Pflichtangaben */}
      <div style={{
        backgroundColor: "#F9F9F9",
        borderBottom: "1px solid #E5E5E5",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}>
        {/* Drag Handle */}
        <div style={{
          flexShrink: 0,
          color: "#7A7A7A",
          cursor: "move",
          display: "flex",
          alignItems: "center"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </div>

        {/* Icon */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: "6px",
          color: "#24c598",
          flexShrink: 0
        }}>
          {BlockIcons[block.type]}
        </div>

        {/* Block Info */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <h4 style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#0A0A0A",
              margin: 0
            }}>
              {BLOCK_TYPE_LABELS[block.type] || block.type}
            </h4>
            {block.status === "published" && (
              <span style={{
                fontSize: "0.75rem",
                color: "#059669",
                backgroundColor: "#D1FAE5",
                padding: "0.125rem 0.5rem",
                borderRadius: "4px",
                fontWeight: "500"
              }}>
                Live
              </span>
            )}
            {block.status === "draft" && (
              <span style={{
                fontSize: "0.75rem",
                color: "#7A7A7A",
                backgroundColor: "#F5F5F5",
                padding: "0.125rem 0.5rem",
                borderRadius: "4px",
                fontWeight: "500"
              }}>
                Entwurf
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {(isHovered || isSelected) && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }} onClick={(e) => e.stopPropagation()}>
            {/* Status Toggle Button - immer verfügbar wenn Block im entsprechenden Status */}
            {block.status === "draft" && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdate({ status: "published" })
                }}
                style={{
                  padding: "0.5rem",
                  color: "#7A7A7A",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#24c598"
                  e.currentTarget.style.backgroundColor = "#F0FDF4"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#7A7A7A"
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
                title="Veröffentlichen"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            )}
            {block.status === "published" && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdate({ status: "draft" })
                }}
                style={{
                  padding: "0.5rem",
                  color: "#7A7A7A",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#24c598"
                  e.currentTarget.style.backgroundColor = "#F0FDF4"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#7A7A7A"
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
                title="Zurück zu Entwurf"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              style={{
                padding: "0.5rem",
                color: "#7A7A7A",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#24c598"
                e.currentTarget.style.backgroundColor = "#F0FDF4"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#7A7A7A"
                e.currentTarget.style.backgroundColor = "transparent"
              }}
              title="Bearbeiten"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              style={{
                padding: "0.5rem",
                color: "#7A7A7A",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#DC2626"
                e.currentTarget.style.backgroundColor = "#FEF2F2"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#7A7A7A"
                e.currentTarget.style.backgroundColor = "transparent"
              }}
              title="Block löschen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content Preview */}
      <div style={{ padding: "1rem 1.5rem" }}>
        {block.type === "text" && (
          <div>
            {(block.content as any)?.heading && (
              <div style={{
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#0A0A0A",
                marginBottom: "0.25rem"
              }}>
                {(block.content as any).heading}
              </div>
            )}
            <div style={{
              fontSize: "0.875rem",
              color: "#0A0A0A",
              lineHeight: "1.5"
            }}>
              {(block.content as any)?.text || "Kein Text eingegeben"}
            </div>
          </div>
        )}
        {block.type === "storytelling" && (
          <div>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              {(block.content as any)?.title || "Ohne Titel"}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A"
            }}>
              {(block.content as any)?.description || "Keine Beschreibung"}
            </div>
          </div>
        )}
        {false && (
          <div>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              {(block.content as any)?.question || "Ohne Frage"}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A"
            }}>
              {(block.content as any)?.options?.length || 0} Optionen
            </div>
          </div>
        )}
        {block.type === "image_text" && (
          <div>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              {(block.content as any)?.text?.heading || "Bild & Text Block"}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A"
            }}>
              Layout: {(block.content as any)?.layout || "image_left"}
            </div>
          </div>
        )}
        {block.type === "video" && (
          <div>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              {(block.content as any)?.title || "Ohne Titel"}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A"
            }}>
              {(block.content as any)?.url || "Keine URL"}
            </div>
          </div>
        )}
        {block.type === "timeline" && (
          <div>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              {(block.content as any)?.title || "Ohne Titel"}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A"
            }}>
              {(block.content as any)?.events?.length || 0} Ereignisse
            </div>
          </div>
        )}
        {block.type === "accordion" && (
          <div>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              {(block.content as any)?.title || "Ohne Titel"}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A"
            }}>
              {(block.content as any)?.items?.length || 0} Elemente
            </div>
          </div>
        )}
        {block.type === "image" && (() => {
          const c = block.content as { url?: string | string[]; alt?: string; caption?: string } | undefined
          const urlRaw = c?.url
          const urls = Array.isArray(urlRaw) ? urlRaw : urlRaw ? [urlRaw] : []
          const hasImages = urls.length > 0 && urls.every((u): u is string => typeof u === "string" && u.length > 0)
          if (!hasImages) {
            return (
              <div style={{ fontSize: "0.875rem", color: "#7A7A7A", fontStyle: "italic" }}>
                Kein Bild
              </div>
            )
          }
          return (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "flex-start"
            }}>
              {urls.slice(0, 6).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={c?.alt || `Bild ${i + 1}`}
                  style={{
                    width: "auto",
                    height: "80px",
                    maxWidth: "120px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    backgroundColor: "#f0f0f0"
                  }}
                />
              ))}
              {urls.length > 6 && (
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "6px",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  color: "#7A7A7A"
                }}>
                  +{urls.length - 6}
                </div>
              )}
            </div>
          )
        })()}
        {!["storytelling", "image_text", "text", "image", "video", "timeline", "accordion"].includes(block.type) && (
          <div style={{
            fontSize: "0.875rem",
            color: "#7A7A7A",
            fontStyle: "italic"
          }}>
            Klicken Sie auf "Bearbeiten", um Inhalte hinzuzufügen
          </div>
        )}
      </div>
    </div>
  )
}
