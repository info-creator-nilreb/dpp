"use client"

/**
 * Block List Component
 * 
 * Displays list of blocks with drag & drop reordering
 */

import { useState } from "react"
import { Block, BlockTypeKey } from "@/lib/cms/types"
import { BLOCK_TYPE_FEATURE_MAP } from "@/lib/cms/validation"
import { getAvailableTemplates, createBlockFromTemplate, BlockTemplate } from "@/lib/cms/templates"
import BlockPickerModal from "./BlockPickerModal"

interface BlockListProps {
  blocks: Block[]
  availableFeatures: string[]
  selectedBlockId: string | null
  onSelectBlock: (blockId: string) => void
  onAddBlock: (type: string) => void
  onDeleteBlock: (blockId: string) => void
  onReorder: (blockIds: string[]) => void
}

const BLOCK_TYPE_LABELS: Record<BlockTypeKey, string> = {
  storytelling: "Storytelling",
  multi_question_poll: "Multi-Question Poll",
  image_text: "Bild & Text",
  text: "Text",
  image: "Bild",
  video: "Video",
  accordion: "Akkordeon",
  timeline: "Timeline",
  template_block: "Template-Block"
}

export default function BlockList({
  blocks,
  availableFeatures,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onDeleteBlock,
  onReorder
}: BlockListProps) {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showBlockPicker, setShowBlockPicker] = useState(false)

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

  function handleDragStart(e: React.DragEvent, blockId: string) {
    setDraggedBlockId(blockId)
    e.dataTransfer.effectAllowed = "move"
    // Add visual feedback
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move"
    }
    // Add drag image
    const target = e.currentTarget as HTMLElement
    if (target) {
      const dragImage = target.cloneNode(true) as HTMLElement
      dragImage.style.opacity = "0.5"
      document.body.appendChild(dragImage)
      e.dataTransfer.setDragImage(dragImage, e.clientX - target.getBoundingClientRect().left, e.clientY - target.getBoundingClientRect().top)
      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  function handleDragLeave() {
    setDragOverIndex(null)
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)

    if (!draggedBlockId) return

    const draggedIndex = sortedBlocks.findIndex(b => b.id === draggedBlockId)
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedBlockId(null)
      return
    }

    const newBlocks = [...sortedBlocks]
    const [removed] = newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(dropIndex, 0, removed)

    const newOrder = newBlocks.map(b => b.id)
    onReorder(newOrder)
    setDraggedBlockId(null)
  }

  function handleDragEnd() {
    setDraggedBlockId(null)
    setDragOverIndex(null)
  }

  // Get available block types
  const availableBlockTypes = Object.keys(BLOCK_TYPE_FEATURE_MAP).filter(type => {
    const featureKey = BLOCK_TYPE_FEATURE_MAP[type as BlockTypeKey]
    return availableFeatures.includes(featureKey)
  }) as BlockTypeKey[]

  const unavailableBlockTypes = Object.keys(BLOCK_TYPE_FEATURE_MAP).filter(type => {
    const featureKey = BLOCK_TYPE_FEATURE_MAP[type as BlockTypeKey]
    return !availableFeatures.includes(featureKey)
  }) as BlockTypeKey[]

  const availableTemplates = getAvailableTemplates(availableFeatures)

  function handleAddFromTemplate(template: BlockTemplate) {
    const newBlock = createBlockFromTemplate(template, blocks.length)
    // Create block via API
    onAddBlock(template.type)
    setShowTemplates(false)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Add Block Button */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <button
          onClick={() => setShowBlockPicker(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          + Block hinzufügen
        </button>
        {availableTemplates.length > 0 && (
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
          >
            {showTemplates ? "Vorlagen ausblenden" : "Aus Vorlage"}
          </button>
        )}
      </div>

      {/* Templates List */}
      {showTemplates && availableTemplates.length > 0 && (
        <div className="p-2 border-b border-gray-200 bg-gray-50 max-h-64 overflow-y-auto">
          <div className="text-xs font-medium text-gray-500 mb-2 px-2">
            Vorlagen:
          </div>
          {availableTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleAddFromTemplate(template)}
              className="w-full text-left p-2 mb-1 bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 text-sm"
            >
              <div className="font-medium">{template.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {template.description}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Block List */}
      <div className="p-2">
        {sortedBlocks.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>Noch keine Blöcke</p>
            <p className="text-xs mt-2">Erstellen Sie einen neuen Block</p>
          </div>
        ) : (
          sortedBlocks.map((block, index) => (
            <div key={block.id} className="relative">
              {/* Drop Indicator */}
              {dragOverIndex === index && draggedBlockId !== block.id && (
                <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full z-10" />
              )}
              
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  mb-2 p-3 rounded border cursor-move transition-all relative
                  ${selectedBlockId === block.id 
                    ? "border-blue-500 bg-blue-50 shadow-sm" 
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }
                  ${draggedBlockId === block.id ? "opacity-50 scale-95 shadow-lg rotate-2" : ""}
                  ${dragOverIndex === index && draggedBlockId !== block.id ? "border-blue-400 bg-blue-100 border-2 transform translate-y-1" : ""}
                `}
                onClick={() => onSelectBlock(block.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {/* Drag Handle */}
                      <span className="text-gray-400 cursor-move" title="Zum Verschieben ziehen">
                        ⋮⋮
                      </span>
                      <span className="text-xs text-gray-400">#{block.order + 1}</span>
                      <span className="text-sm font-medium">
                        {BLOCK_TYPE_LABELS[block.type] || block.type}
                      </span>
                      {block.status === "published" && (
                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {block.type}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteBlock(block.id)
                    }}
                    className="text-gray-400 hover:text-red-600 text-sm"
                    title="Block löschen"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Unavailable Block Types (with upgrade hints) */}
      {unavailableBlockTypes.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs font-medium text-gray-500 mb-2">
            Nicht verfügbar
          </div>
          {unavailableBlockTypes.map(type => {
            const featureKey = BLOCK_TYPE_FEATURE_MAP[type]
            return (
              <div
                key={type}
                className="text-xs text-gray-400 mb-1 opacity-60"
                title={`Erfordert: ${featureKey}`}
              >
                {BLOCK_TYPE_LABELS[type]}
              </div>
            )
          })}
        </div>
      )}

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <BlockPickerModal
          availableFeatures={availableFeatures}
          onSelectBlock={(type) => {
            onAddBlock(type)
            setShowBlockPicker(false)
          }}
          onClose={() => setShowBlockPicker(false)}
        />
      )}
    </div>
  )
}

