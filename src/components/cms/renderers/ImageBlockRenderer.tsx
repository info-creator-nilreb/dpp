"use client"

/**
 * Image Block Renderer
 * 
 * Renders image blocks in editorial style
 */

import { Block, StylingConfig } from "@/lib/cms/types"
import { Section, Image } from "@/components/editorial"

interface ImageBlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function ImageBlockRenderer({
  block,
  theme
}: ImageBlockRendererProps) {
  const content = block.content as {
    url: string
    alt: string
    caption?: string
    alignment?: "left" | "center" | "right"
  }

  if (!content.url) return null

  return (
    <Section variant="contained">
      <div style={{
        textAlign: content.alignment || "center",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <div style={{
          marginBottom: content.caption ? "0.75rem" : 0
        }}>
          <Image
            src={content.url}
            alt={content.alt}
            aspectRatio="16:9"
          />
        </div>
        {content.caption && (
          <p style={{
            fontSize: "0.875rem",
            color: "#7A7A7A",
            fontStyle: "italic",
            marginTop: "0.5rem"
          }}>
            {content.caption}
          </p>
        )}
      </div>
    </Section>
  )
}

