"use client"

import { useState } from "react"
import TemplateBlockField from "@/components/TemplateBlockField"

// Accordion-Sektion Komponente (kopiert aus DppEditor für Wiederverwendbarkeit)
function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
  alwaysOpen = false,
  statusBadge
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  alwaysOpen?: boolean
  statusBadge?: React.ReactNode
}) {
  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      border: "1px solid #CDCDCD",
      marginBottom: "1.5rem",
      overflow: "visible",
      position: "relative"
    }}>
      <button
        type="button"
        onClick={alwaysOpen ? undefined : onToggle}
        disabled={alwaysOpen}
        style={{
          width: "100%",
          padding: "clamp(1rem, 3vw, 1.25rem)",
          backgroundColor: alwaysOpen ? "#F5F5F5" : "transparent",
          border: "none",
          borderBottom: isOpen && !alwaysOpen ? "1px solid #CDCDCD" : "none",
          borderRadius: alwaysOpen ? "12px" : "0",
          cursor: alwaysOpen ? "default" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "left"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h2 style={{
            fontSize: "clamp(1.1rem, 3vw, 1.25rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            margin: 0
          }}>
            {title}
          </h2>
          {statusBadge}
        </div>
        {!alwaysOpen && (
          <span style={{
            fontSize: "1.5rem",
            color: "#7A7A7A",
            transition: "transform 0.2s"
          }}>
            {isOpen ? "−" : "+"}
          </span>
        )}
      </button>
      {(isOpen || alwaysOpen) && (
        <div style={{
          padding: "clamp(1.5rem, 4vw, 2rem)",
          position: "relative",
          zIndex: 1
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

interface TemplateBlocksSectionProps {
  template: {
    id: string
    name: string
    blocks: Array<{
      id: string
      name: string
      order: number
      fields: Array<{
        id: string
        label: string
        key: string
        type: string
        required: boolean
        config: any
        order: number
      }>
    }>
  }
  dppId: string | null
  media: Array<{
    id: string
    fileName: string
    fileType: string
    storageUrl: string
    blockId?: string | null
    fieldId?: string | null
  }>
  onMediaChange: () => void
}

/**
 * Rendert Template-Blöcke dynamisch
 */
export default function TemplateBlocksSection({
  template,
  dppId,
  media,
  onMediaChange
}: TemplateBlocksSectionProps) {
  // State für Accordion-Öffnung (erster Block immer offen)
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(
    new Set([template.blocks[0]?.id])
  )

  const toggleBlock = (blockId: string) => {
    setOpenBlocks(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  return (
    <>
      {template.blocks.map((block) => {
        const isOpen = openBlocks.has(block.id)
        const isFirstBlock = block.order === 0

        return (
          <AccordionSection
            key={block.id}
            title={block.name}
            isOpen={isOpen}
            onToggle={() => toggleBlock(block.id)}
            alwaysOpen={isFirstBlock}
          >
            {block.fields.map((field) => (
              <TemplateBlockField
                key={field.id}
                field={field}
                blockId={block.id}
                dppId={dppId}
                media={media}
                onMediaChange={onMediaChange}
              />
            ))}
          </AccordionSection>
        )
      })}
    </>
  )
}

