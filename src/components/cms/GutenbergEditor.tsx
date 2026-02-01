"use client"

/**
 * Gutenberg-inspired Editor
 * 
 * Modern block-based editor with:
 * - Read-only compliance reference
 * - Draggable content blocks
 * - Inline editing
 */

import { useState } from "react"
import { Block } from "@/lib/cms/types"
import ComplianceReference from "./ComplianceReference"
import ContentBlockCard from "./ContentBlockCard"
import BlockPickerModal from "./BlockPickerModal"

interface GutenbergEditorProps {
  dppId: string
  blocks: Block[]
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
  onAddBlock: (type: string) => void
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void
  onDeleteBlock: (blockId: string) => void
  onReorderBlocks: (blockIds: string[]) => void
  availableFeatures: string[]
}

export default function GutenbergEditor({
  dppId,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
  availableFeatures
}: GutenbergEditorProps) {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showBlockPicker, setShowBlockPicker] = useState(false)

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

  function handleDragStart(e: React.DragEvent, blockId: string) {
    setDraggedBlockId(blockId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", blockId)
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
    onReorderBlocks(newOrder)
    setDraggedBlockId(null)
  }

  function handleDragEnd() {
    setDraggedBlockId(null)
    setDragOverIndex(null)
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Info Banner */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Content-Blöcke sind optional
              </h3>
              <p className="text-sm text-blue-800">
                Die Pflichtinformationen aus dem Produktpass-Template sind fest integriert
                und werden automatisch angezeigt. Content-Blöcke ergänzen diese Informationen
                um zusätzliche Inhalte wie Storytelling, Umfragen oder Bilder.
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Reference (Read-only) */}
        <ComplianceReference dppId={dppId} />

        {/* Content Blocks Area */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Content-Blöcke</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Zusätzliche Inhalte, die nach den Pflichtinformationen angezeigt werden
              </p>
            </div>
            <button
              onClick={() => setShowBlockPicker(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Block hinzufügen
            </button>
          </div>

          {/* Blocks List */}
          {sortedBlocks.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-4">📦</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Noch keine Content-Blöcke
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Erstellen Sie Ihren ersten Content-Block, um zusätzliche Inhalte hinzuzufügen
              </p>
              <button
                onClick={() => setShowBlockPicker(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Ersten Block erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBlocks.map((block, index) => (
                <div key={block.id} className="relative">
                  {/* Drop Indicator */}
                  {dragOverIndex === index && draggedBlockId !== block.id && (
                    <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full z-10" />
                  )}

                  <ContentBlockCard
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    isDragging={draggedBlockId === block.id}
                    onSelect={() => onSelectBlock(block.id)}
                    onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                    onDelete={() => onDeleteBlock(block.id)}
                    onDragStart={(e) => handleDragStart(e, block.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    dppId={dppId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

