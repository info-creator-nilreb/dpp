"use client"

/**
 * Image Text Block Renderer
 */

import { Block, StylingConfig } from "@/lib/cms/types"
import { ImageTextBlockContent } from "@/lib/cms/types"

interface ImageTextBlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function ImageTextBlockRenderer({
  block,
  theme
}: ImageTextBlockRendererProps) {
  const content = block.content as ImageTextBlockContent

  // Determine layout classes
  const layoutClasses = {
    image_left: "flex flex-row gap-6",
    image_right: "flex flex-row-reverse gap-6",
    image_top: "flex flex-col gap-4",
    image_bottom: "flex flex-col-reverse gap-4"
  }

  const layoutClass = layoutClasses[content.layout] || layoutClasses.image_left

  return (
    <div className={`image-text-block ${layoutClass}`}>
      {/* Image */}
      <div className="flex-shrink-0" style={{ flexBasis: content.layout.includes("left") || content.layout.includes("right") ? "40%" : "100%" }}>
        <img
          src={content.image.url}
          alt={content.image.alt}
          className="w-full h-auto rounded-lg"
        />
        {content.image.caption && (
          <p 
            className="text-sm mt-2 text-center"
            style={{ color: theme.colors.secondary }}
          >
            {content.image.caption}
          </p>
        )}
      </div>

      {/* Text */}
      <div className="flex-1">
        {content.text.heading && (
          <h3 
            className="text-2xl font-semibold mb-3"
            style={{ color: theme.colors.primary }}
          >
            {content.text.heading}
          </h3>
        )}
        {content.text.content && (
          <div 
            className="text-base leading-relaxed"
            style={{ color: theme.colors.secondary }}
            dangerouslySetInnerHTML={{ __html: content.text.content.replace(/\n/g, '<br />') }}
          />
        )}
      </div>
    </div>
  )
}

