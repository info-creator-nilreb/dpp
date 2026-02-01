"use client"

/**
 * CMS Editor Component
 * 
 * Main component for managing DPP content blocks and styling
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Block, StylingConfig, UpdateStylingRequest } from "@/lib/cms/types"
import BlockList from "./BlockList"
import BlockEditor from "./BlockEditor"
import StylingEditor from "./StylingEditor"
import PreviewMode from "./PreviewMode"
import { useNotification } from "@/components/NotificationProvider"

interface CmsEditorProps {
  dppId: string
  organizationId: string
  userId: string
}

export default function CmsEditor({ dppId, organizationId, userId }: CmsEditorProps) {
  const router = useRouter()
  const { showNotification } = useNotification()
  
  const [blocks, setBlocks] = useState<Block[]>([])
  const [styling, setStyling] = useState<StylingConfig | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([])
  const [canUseStyling, setCanUseStyling] = useState(false)
  const [canPublish, setCanPublish] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Load content on mount
  useEffect(() => {
    loadContent()
    loadCapabilities()
  }, [dppId])

  async function loadContent() {
    try {
      setLoading(true)
      const response = await fetch(`/api/app/dpp/${dppId}/content`)
      if (!response.ok) {
        throw new Error("Fehler beim Laden des Contents")
      }
      const data = await response.json()
      setBlocks(data.content.blocks || [])
      setStyling(data.content.styling || null)
      setIsPublished(data.isPublished || false)
    } catch (error) {
      console.error("Error loading content:", error)
      showNotification("Fehler beim Laden des Contents", "error")
    } finally {
      setLoading(false)
    }
  }

  async function loadCapabilities() {
    try {
      const response = await fetch(`/api/app/capabilities/check?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableFeatures(data.features || [])
        setCanUseStyling(data.features?.includes("cms_styling") || false)
        setCanPublish(data.features?.includes("publish_dpp") || false)
      }
    } catch (error) {
      console.error("Error loading capabilities:", error)
    }
  }

  async function handleSave(publish: boolean = false) {
    try {
      setSaving(true)
      const response = await fetch(`/api/app/dpp/${dppId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks,
          styling,
          publish
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

      const data = await response.json()
      setIsPublished(publish)
      showNotification(
        publish ? "Content veröffentlicht" : "Content gespeichert",
        "success"
      )
    } catch (error: any) {
      console.error("Error saving content:", error)
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
        body: JSON.stringify({
          type,
          content: {}
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Erstellen des Blocks")
      }

      const data = await response.json()
      setBlocks([...blocks, data.block])
      setSelectedBlockId(data.block.id)
      showNotification("Block erstellt", "success")
    } catch (error: any) {
      console.error("Error creating block:", error)
      showNotification(error.message || "Fehler beim Erstellen des Blocks", "error")
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
        throw new Error(error.error || "Fehler beim Aktualisieren des Blocks")
      }

      const data = await response.json()
      setBlocks(blocks.map(b => b.id === blockId ? data.block : b))
      showNotification("Block aktualisiert", "success")
    } catch (error: any) {
      console.error("Error updating block:", error)
      showNotification(error.message || "Fehler beim Aktualisieren des Blocks", "error")
    }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!confirm("Block wirklich löschen?")) {
      return
    }

    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/blocks/${blockId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Löschen des Blocks")
      }

      setBlocks(blocks.filter(b => b.id !== blockId))
      if (selectedBlockId === blockId) {
        setSelectedBlockId(null)
      }
      showNotification("Block gelöscht", "success")
    } catch (error: any) {
      console.error("Error deleting block:", error)
      showNotification(error.message || "Fehler beim Löschen des Blocks", "error")
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
        throw new Error(error.error || "Fehler beim Neuordnen der Blöcke")
      }

      const data = await response.json()
      setBlocks(data.blocks)
      showNotification("Blöcke neu geordnet", "success")
    } catch (error: any) {
      console.error("Error reordering blocks:", error)
      showNotification(error.message || "Fehler beim Neuordnen der Blöcke", "error")
    }
  }

  async function handleUpdateStyling(updates: UpdateStylingRequest) {
    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/styling`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Aktualisieren des Stylings")
      }

      const data = await response.json()
      setStyling(data.styling)
      showNotification("Styling aktualisiert", "success")
    } catch (error: any) {
      console.error("Error updating styling:", error)
      showNotification(error.message || "Fehler beim Aktualisieren des Stylings", "error")
    }
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Lade Content...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar: Block List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Content Blöcke</h2>
          <p className="text-sm text-gray-500 mt-1">
            {blocks.length} Block{blocks.length !== 1 ? "e" : ""}
          </p>
        </div>
        
        <BlockList
          blocks={blocks}
          availableFeatures={availableFeatures}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onAddBlock={handleAddBlock}
          onDeleteBlock={handleDeleteBlock}
          onReorder={handleReorderBlocks}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">CMS Editor</h1>
            {isPublished && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded mt-1 inline-block">
                Veröffentlicht
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Vorschau
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {saving ? "Speichere..." : "Speichern"}
            </button>
            {canPublish && (
              <button
                onClick={() => handleSave(true)}
                disabled={saving || isPublished}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Veröffentliche..." : "Veröffentlichen"}
              </button>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-auto">
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onUpdate={(updates) => handleUpdateBlock(selectedBlock.id, updates)}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>Wählen Sie einen Block aus oder erstellen Sie einen neuen Block</p>
            </div>
          )}
        </div>
      </div>

      {/* Styling Sidebar (Premium) */}
      {canUseStyling && (
        <div className="w-80 bg-white border-l border-gray-200">
          <StylingEditor
            styling={styling}
            onUpdate={handleUpdateStyling}
            dppId={dppId}
          />
        </div>
      )}

      {/* Preview Mode */}
      {showPreview && (
        <PreviewMode
          blocks={blocks}
          styling={styling}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

