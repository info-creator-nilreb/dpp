"use client"

/**
 * Timeline Block Renderer
 * 
 * Renders timeline blocks in editorial style
 */

import { Block, StylingConfig } from "@/lib/cms/types"
import { Section, TextBlock } from "@/components/editorial"

interface TimelineBlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function TimelineBlockRenderer({
  block,
  theme
}: TimelineBlockRendererProps) {
  const content = block.content as {
    title?: string
    events: Array<{
      date: string
      title: string
      description: string
    }>
  }

  if (!content.events || content.events.length === 0) return null

  return (
    <Section variant="contained">
      <div style={{
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        {content.title && (
          <h2 style={{
            fontSize: "2rem",
            fontWeight: 600,
            marginBottom: "2rem",
            color: theme.colors?.primary || "#0A0A0A"
          }}>
            {content.title}
          </h2>
        )}
        <div style={{
          position: "relative",
          paddingLeft: "2rem"
        }}>
          {/* Timeline line */}
          <div style={{
            position: "absolute",
            left: "0.5rem",
            top: 0,
            bottom: 0,
            width: "2px",
            backgroundColor: theme.colors?.accent || "#24c598"
          }} />
          
          {/* Events */}
          {content.events.map((event, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                marginBottom: "2rem",
                paddingLeft: "1.5rem"
              }}
            >
              {/* Timeline dot */}
              <div style={{
                position: "absolute",
                left: "-0.375rem",
                top: "0.25rem",
                width: "0.75rem",
                height: "0.75rem",
                borderRadius: "50%",
                backgroundColor: theme.colors?.accent || "#24c598",
                border: "3px solid #FFFFFF",
                boxShadow: "0 0 0 2px " + (theme.colors?.accent || "#24c598")
              }} />
              
              {/* Event content */}
              <div>
                {event.date && (
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: theme.colors?.accent || "#24c598",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    {event.date}
                  </div>
                )}
                {event.title && (
                  <h3 style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: theme.colors?.primary || "#0A0A0A"
                  }}>
                    {event.title}
                  </h3>
                )}
                {event.description && (
                  <TextBlock>
                    {event.description}
                  </TextBlock>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

