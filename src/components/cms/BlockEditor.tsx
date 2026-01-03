"use client"

/**
 * Block Editor Component
 * 
 * Edits individual block content
 */

import { useState, useEffect } from "react"
import { Block, UpdateBlockRequest } from "@/lib/cms/types"
import StorytellingBlockEditor from "./blocks/StorytellingBlockEditor"
import QuickPollBlockEditor from "./blocks/QuickPollBlockEditor"
import ImageTextBlockEditor from "./blocks/ImageTextBlockEditor"

interface BlockEditorProps {
  block: Block
  onUpdate: (updates: UpdateBlockRequest) => void
}

export default function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  const [content, setContent] = useState(block.content)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setContent(block.content)
    setHasChanges(false)
  }, [block.id])

  function handleContentChange(newContent: Record<string, any>) {
    setContent(newContent)
    setHasChanges(true)
  }

  function handleSave() {
    onUpdate({ content })
    setHasChanges(false)
  }

  function handleCancel() {
    setContent(block.content)
    setHasChanges(false)
  }

  // Render block-specific editor
  function renderBlockEditor() {
    switch (block.type) {
      case "storytelling":
        return (
          <StorytellingBlockEditor
            content={content}
            onChange={handleContentChange}
          />
        )
      case "quick_poll":
        return (
          <QuickPollBlockEditor
            content={content}
            onChange={handleContentChange}
          />
        )
      case "image_text":
        return (
          <ImageTextBlockEditor
            content={content}
            onChange={handleContentChange}
          />
        )
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            <p>Editor für Block-Typ "{block.type}" noch nicht implementiert</p>
          </div>
        )
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Block bearbeiten</h2>
            <p className="text-sm text-gray-500 mt-1">
              Typ: {block.type} • Order: {block.order}
            </p>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Speichern
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderBlockEditor()}
      </div>
    </div>
  )
}

