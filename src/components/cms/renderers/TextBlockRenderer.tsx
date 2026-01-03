"use client"

/**
 * Text Block Renderer
 * 
 * Renders text blocks in editorial style
 */

import { Block, StylingConfig } from "@/lib/cms/types"
import { Section, TextBlock } from "@/components/editorial"

interface TextBlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function TextBlockRenderer({
  block,
  theme
}: TextBlockRendererProps) {
  const content = block.content as {
    heading?: string
    text: string
    alignment?: "left" | "center" | "right"
    fontSize?: "small" | "medium" | "large"
    fontWeight?: "normal" | "bold"
    fontStyle?: "normal" | "italic"
    textDecoration?: "none" | "underline"
  }

  const sizeMap = {
    small: "sm" as const,
    medium: "base" as const,
    large: "lg" as const
  }

  const weightMap = {
    normal: "normal" as const,
    bold: "bold" as const
  }

  return (
    <Section variant="contained">
      <div style={{
        textAlign: content.alignment || "left",
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        {content.heading && (
          <h2 style={{
            fontSize: content.fontSize === "small" ? "1.5rem" : content.fontSize === "large" ? "2.5rem" : "2rem",
            fontWeight: content.fontWeight === "bold" ? 700 : 600,
            marginBottom: "1rem",
            lineHeight: 1.2,
            color: theme.colors?.primary || "#0A0A0A"
          }}>
            {content.heading}
          </h2>
        )}
        <TextBlock
          size={sizeMap[content.fontSize || "medium"]}
          weight={weightMap[content.fontWeight || "normal"]}
          style={{
            fontStyle: content.fontStyle === "italic" ? "italic" : "normal",
            textDecoration: content.textDecoration === "underline" ? "underline" : "none",
            whiteSpace: "pre-wrap"
          }}
        >
          {content.text}
        </TextBlock>
      </div>
    </Section>
  )
}

