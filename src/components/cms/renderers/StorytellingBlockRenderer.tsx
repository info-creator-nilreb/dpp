"use client"

/**
 * Storytelling Block Renderer
 */

import { Block, StylingConfig } from "@/lib/cms/types"
import { StorytellingBlockContent } from "@/lib/cms/types"

interface StorytellingBlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function StorytellingBlockRenderer({
  block,
  theme
}: StorytellingBlockRendererProps) {
  const content = block.content as StorytellingBlockContent

  return (
    <div className="storytelling-block">
      {/* Title */}
      {content.title && (
        <h2 
          className="text-3xl font-bold mb-4"
          style={{ color: theme.colors.primary }}
        >
          {content.title}
        </h2>
      )}

      {/* Description */}
      {content.description && (
        <p 
          className="text-lg mb-6 leading-relaxed"
          style={{ color: theme.colors.secondary }}
        >
          {content.description}
        </p>
      )}

      {/* Images */}
      {content.images && content.images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {content.images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-auto rounded-lg"
              />
              {image.caption && (
                <p 
                  className="text-sm mt-2 text-center"
                  style={{ color: theme.colors.secondary }}
                >
                  {image.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {content.sections && content.sections.length > 0 && (
        <div className="space-y-8">
          {content.sections.map((section, index) => (
            <div key={index} className="section">
              {section.heading && (
                <h3 
                  className="text-2xl font-semibold mb-3"
                  style={{ color: theme.colors.primary }}
                >
                  {section.heading}
                </h3>
              )}
              {section.text && (
                <p 
                  className="text-base leading-relaxed mb-4"
                  style={{ color: theme.colors.secondary }}
                >
                  {section.text}
                </p>
              )}
              {section.image && (
                <img
                  src={section.image}
                  alt=""
                  className="w-full h-auto rounded-lg mb-4"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

