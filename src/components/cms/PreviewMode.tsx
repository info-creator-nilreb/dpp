"use client"

/**
 * Preview Mode Component
 * 
 * Shows preview of content before publishing
 */

import { Block, StylingConfig } from "@/lib/cms/types"
import { BlocksRenderer } from "./renderers/BlockRenderer"

interface PreviewModeProps {
  blocks: Block[]
  styling: StylingConfig | null
  onClose: () => void
}

export default function PreviewMode({ blocks, styling, onClose }: PreviewModeProps) {
  // Filter only published blocks for preview
  const previewBlocks = blocks.map(block => ({
    ...block,
    status: "published" as const
  }))

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vorschau</h2>
          <p className="text-sm text-gray-500 mt-1">
            So wird Ihr Content angezeigt
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Schließen
        </button>
      </div>

      {/* Preview Content */}
      <div className="overflow-y-auto h-[calc(100vh-73px)] p-8 max-w-4xl mx-auto">
        <BlocksRenderer blocks={previewBlocks} styling={styling} />
      </div>
    </div>
  )
}

