"use client"

/**
 * Video Block Renderer
 * 
 * Renders video blocks in editorial style
 */

import { Block, StylingConfig } from "@/lib/cms/types"
import { Section } from "@/components/editorial"

interface VideoBlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function VideoBlockRenderer({
  block,
  theme
}: VideoBlockRendererProps) {
  const content = block.content as {
    url: string
    title?: string
    description?: string
    autoplay?: boolean
    loop?: boolean
  }

  if (!content.url) return null

  // Extract video ID from YouTube/Vimeo URLs
  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        const videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop()
        return `https://www.youtube.com/embed/${videoId}?${content.autoplay ? "autoplay=1&" : ""}${content.loop ? "loop=1&playlist=" + videoId : ""}`
      } else if (urlObj.hostname.includes("vimeo.com")) {
        const videoId = urlObj.pathname.split("/").pop()
        return `https://player.vimeo.com/video/${videoId}?${content.autoplay ? "autoplay=1&" : ""}${content.loop ? "loop=1" : ""}`
      }
      return url
    } catch {
      return url
    }
  }

  const embedUrl = getEmbedUrl(content.url)

  return (
    <Section variant="contained">
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {content.title && (
          <h3 style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1rem",
            color: theme.colors?.primary || "#0A0A0A"
          }}>
            {content.title}
          </h3>
        )}
        <div style={{
          position: "relative",
          paddingBottom: "56.25%", // 16:9 aspect ratio
          height: 0,
          overflow: "hidden",
          borderRadius: "12px",
          backgroundColor: "#000"
        }}>
          <iframe
            src={embedUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none"
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {content.description && (
          <p style={{
            fontSize: "0.875rem",
            color: "#7A7A7A",
            marginTop: "1rem",
            lineHeight: 1.6
          }}>
            {content.description}
          </p>
        )}
      </div>
    </Section>
  )
}

