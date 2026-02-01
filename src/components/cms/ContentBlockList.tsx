"use client"

/**
 * Content Block List
 * 
 * Moderne, card-basierte Block-Liste
 */

import { useState } from "react"
import { Block, BlockTypeKey } from "@/lib/cms/types"

interface ContentBlockListProps {
  blocks: Block[]
  selectedBlockId: string | null
  onSelectBlock: (blockId: string) => void
  onDeleteBlock: (blockId: string) => void
  onReorder: (blockIds: string[]) => void
}

const BLOCK_TYPE_LABELS: Record<BlockTypeKey, string> = {
  storytelling: "Storytelling",
  multi_question_poll: "Umfrage",
  image_text: "Bild & Text",
  text: "Text",
  image: "Bild",
  video: "Video",
  accordion: "Akkordeon",
  timeline: "Timeline",
  template_block: "Template-Block"
}

const BLOCK_TYPE_ICONS: Record<BlockTypeKey, string> = {
  storytelling: "📖",
  multi_question_poll: "📊",
  image_text: "🖼️",
  text: "📝",
  image: "🖼️",
  video: "🎥",
  accordion: "📋",
  timeline: "⏱️",
  template_block: "📄"
}

export default function ContentBlockList({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onDeleteBlock,
  onReorder
}: ContentBlockListProps) {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

  function handleDragStart(e: React.DragEvent, blockId: string) {
    setDraggedBlockId(blockId)
    e.dataTransfer.effectAllowed = "move"
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

  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-500 mb-2">Noch keine Blöcke</p>
          <p className="text-sm text-gray-400">
            Erstellen Sie Ihren ersten Content-Block
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {sortedBlocks.map((block, index) => (
        <div key={block.id} className="relative mb-3">
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
            onClick={() => onSelectBlock(block.id)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all
              ${selectedBlockId === block.id
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }
              ${draggedBlockId === block.id ? "opacity-50 scale-95" : ""}
              ${dragOverIndex === index && draggedBlockId !== block.id ? "border-blue-400 bg-blue-100" : ""}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">
                {BLOCK_TYPE_ICONS[block.type] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {BLOCK_TYPE_LABELS[block.type] || block.type}
                  </span>
                  {block.status === "published" && (
                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      Live
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  #{block.order + 1}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteBlock(block.id)
                }}
                className="text-gray-400 hover:text-red-600 text-lg flex-shrink-0"
                title="Block löschen"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

