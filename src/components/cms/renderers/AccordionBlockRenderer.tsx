"use client"

/**
 * Accordion Block Renderer
 * 
 * Renders accordion blocks in editorial style
 */

import { useState } from "react"
import { Block, StylingConfig } from "@/lib/cms/types"
import { Section, TextBlock } from "@/components/editorial"

interface AccordionBlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function AccordionBlockRenderer({
  block,
  theme
}: AccordionBlockRendererProps) {
  const content = block.content as {
    title?: string
    items: Array<{
      question: string
      answer: string
    }>
  }

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!content.items || content.items.length === 0) return null

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
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          {content.items.map((item, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                overflow: "hidden",
                transition: "all 0.2s"
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                style={{
                  width: "100%",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F9F9F9"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
              >
                <span style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: theme.colors?.primary || "#0A0A0A",
                  flex: 1
                }}>
                  {item.question}
                </span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.colors?.accent || "#24c598"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: openIndex === index ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                    marginLeft: "1rem"
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openIndex === index && (
                <div style={{
                  padding: "0 1.5rem 1.5rem 1.5rem",
                  borderTop: "1px solid #E5E5E5"
                }}>
                  <TextBlock style={{
                    marginTop: "1rem",
                    color: "#7A7A7A"
                  }}>
                    {item.answer}
                  </TextBlock>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

