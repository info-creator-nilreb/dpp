"use client"

/**
 * DPP Content Tab - Gutenberg-inspired
 * 
 * Modern block-based CMS experience
 */

import { useState } from "react"
import { Block } from "@/lib/cms/types"
import GutenbergEditor from "@/components/cms/GutenbergEditor"
import BlockPickerModal from "@/components/cms/BlockPickerModal"
import { useNotification } from "@/components/NotificationProvider"

interface DppContentTabProps {
  dppId: string
  organizationId: string
  userId: string
  blocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
  availableFeatures: string[]
  loading: boolean
  onReload: () => void
}

export default function DppContentTab({
  dppId,
  blocks,
  onBlocksChange,
  availableFeatures,
  loading,
  onReload
}: DppContentTabProps) {
  const { showNotification } = useNotification()
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    try {
      setSaving(true)
      const response = await fetch(`/api/app/dpp/${dppId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

      showNotification("Content gespeichert", "success")
      onReload()
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Speichern", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddBlock(type: string) {
    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: {} })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Erstellen")
      }

      const data = await response.json()
      onBlocksChange([...blocks, data.block])
      setSelectedBlockId(data.block.id)
      setShowBlockPicker(false)
      showNotification("Block erstellt", "success")
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Erstellen", "error")
    }
  }

  async function handleUpdateBlock(blockId: string, updates: Partial<Block>) {
    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Aktualisieren")
      }

      const data = await response.json()
      onBlocksChange(blocks.map(b => b.id === blockId ? data.block : b))
      showNotification("Block aktualisiert", "success")
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Aktualisieren", "error")
    }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!confirm("Block wirklich löschen?")) return

    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/blocks/${blockId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Löschen")
      }

      onBlocksChange(blocks.filter(b => b.id !== blockId))
      if (selectedBlockId === blockId) {
        setSelectedBlockId(null)
      }
      showNotification("Block gelöscht", "success")
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Löschen", "error")
    }
  }

  async function handleReorderBlocks(newOrder: string[]) {
    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/blocks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockIds: newOrder })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Neuordnen")
      }

      const data = await response.json()
      onBlocksChange(data.blocks)
      showNotification("Blöcke neu geordnet", "success")
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Neuordnen", "error")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-gray-500">Lade Content...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Content Editor</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Erstellen Sie zusätzliche Inhalte für Ihren Digital Product Passport
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm"
        >
          {saving ? "Speichere..." : "Speichern"}
        </button>
      </div>

      {/* Gutenberg Editor */}
      <div className="flex-1 overflow-hidden">
        <GutenbergEditor
          dppId={dppId}
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onAddBlock={handleAddBlock}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onReorderBlocks={handleReorderBlocks}
          availableFeatures={availableFeatures}
        />
      </div>

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <BlockPickerModal
          availableFeatures={availableFeatures}
          onSelectBlock={handleAddBlock}
          onClose={() => setShowBlockPicker(false)}
        />
      )}
    </div>
  )
}
