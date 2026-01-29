"use client"

/**
 * Block Renderer
 * 
 * Renders blocks based on type and theme
 */

import { Block, StylingConfig } from "@/lib/cms/types"
import { resolveTheme } from "@/lib/cms/theme-resolver"
import StorytellingBlockRenderer from "./StorytellingBlockRenderer"
import ImageTextBlockRenderer from "./ImageTextBlockRenderer"
import TextBlockRenderer from "./TextBlockRenderer"
import ImageBlockRenderer from "./ImageBlockRenderer"
import VideoBlockRenderer from "./VideoBlockRenderer"
import TimelineBlockRenderer from "./TimelineBlockRenderer"
import AccordionBlockRenderer from "./AccordionBlockRenderer"

interface BlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function BlockRenderer({ block, theme }: BlockRendererProps) {
  // Render block based on type
  switch (block.type) {
    case "storytelling":
      return <StorytellingBlockRenderer block={block} theme={theme} />
    case "image_text":
      return <ImageTextBlockRenderer block={block} theme={theme} />
    case "text":
      return <TextBlockRenderer block={block} theme={theme} />
    case "image":
      return <ImageBlockRenderer block={block} theme={theme} />
    case "video":
      return <VideoBlockRenderer block={block} theme={theme} />
    case "timeline":
      return <TimelineBlockRenderer block={block} theme={theme} />
    case "accordion":
      return <AccordionBlockRenderer block={block} theme={theme} />
    default:
      return (
        <div className="p-8 text-center text-gray-500 border border-gray-200 rounded">
          <p>Block-Typ "{block.type}" wird noch nicht unterstützt</p>
        </div>
      )
  }
}

/**
 * Render multiple blocks with theme
 */
interface BlocksRendererProps {
  blocks: Block[]
  styling?: StylingConfig | null
  includeDrafts?: boolean // For preview mode - show draft blocks too
}

export function BlocksRenderer({ blocks, styling, includeDrafts = false }: BlocksRendererProps) {
  const theme = resolveTheme(styling || undefined)
  
  // Filter and sort blocks
  const sortedBlocks = [...blocks]
    .filter(block => includeDrafts ? (block.status === "published" || block.status === "draft") : block.status === "published")
    .sort((a, b) => a.order - b.order)

  if (sortedBlocks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Keine Blöcke verfügbar</p>
      </div>
    )
  }

  return (
    <div 
      className="cms-content"
      style={{
        fontFamily: theme.fonts?.primary || "inherit",
        '--primary-color': theme.colors.primary,
        '--secondary-color': theme.colors.secondary,
        '--accent-color': theme.colors.accent,
        '--block-spacing': `${theme.spacing?.blockSpacing || 24}px`,
        '--section-padding': `${theme.spacing?.sectionPadding || 32}px`
      } as React.CSSProperties}
    >
      {sortedBlocks.map((block) => (
        <div
          key={block.id}
          className="cms-block"
          style={{
            marginBottom: theme.spacing?.blockSpacing || 24
          }}
        >
          <BlockRenderer block={block} theme={theme} />
        </div>
      ))}
    </div>
  )
}

