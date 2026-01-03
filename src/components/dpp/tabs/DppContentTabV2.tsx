"use client"

/**
 * DPP Content Tab - Refactored
 * 
 * Block-based CMS editor matching template editor structure
 * - Card-based sections
 * - "Add section" buttons
 * - Clear separation: compliance reference + content blocks
 */

import { useState, useRef, useEffect } from "react"
import { Block } from "@/lib/cms/types"
import ContentBlockCard from "@/components/cms/ContentBlockCard"
import BlockPickerModal from "@/components/cms/BlockPickerModal"
import { useNotification } from "@/components/NotificationProvider"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import ConfirmDialog from "@/components/ConfirmDialog"
import { useAutoSave } from "@/hooks/useAutoSave"

interface DppContentTabV2Props {
  dppId: string
  organizationId: string
  userId: string
  blocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
  availableFeatures: string[]
  loading: boolean
  onReload: () => void
  onStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void
  onLastSavedChange?: (date: Date | null) => void
}

export default function DppContentTabV2({
  dppId,
  blocks,
  onBlocksChange,
  availableFeatures,
  loading,
  onReload,
  onStatusChange,
  onLastSavedChange
}: DppContentTabV2Props) {
  const { showNotification } = useNotification()
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [deleteConfirmBlockId, setDeleteConfirmBlockId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingBlocksRef = useRef<Block[] | null>(null) // Only for tracking pending saves

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

  // Auto-Save: Save block changes
  // CRITICAL: Receives blocks as parameter - no refs for content data
  // Server is write-only - never reloads from server response
  const performAutoSave = async (blocksToSave: Block[]) => {
    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: blocksToSave })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

      // CRITICAL: Server is write-only - no state updates from server response
      // Client draft (blocks prop) is the single source of truth
      pendingBlocksRef.current = null
      const savedDate = new Date()
      onLastSavedChange?.(savedDate) // ALWAYS propagate (same pattern as DppEditor)
      // No notification for auto-save (silent)
      // No reload - blocks prop remains unchanged
    } catch (error: any) {
      showNotification("Auto-Save fehlgeschlagen. Bitte versuchen Sie es erneut.", "error")
      throw error
    }
  }

  // CRITICAL: scheduleSave wrapper that passes current blocks
  // Debounce works on parameters, not refs
  // SYNCHRONE State-Updates in UI, asynchrones Auto-Save
  const scheduleSaveWithBlocks = (blocksToSave: Block[]) => {
    pendingBlocksRef.current = blocksToSave
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Schedule save with current blocks
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingBlocksRef.current) {
        performAutoSave(pendingBlocksRef.current)
      }
    }, 500) // 500ms debounce - catches every change including single characters
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

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
      const updatedBlocks = [...blocks, data.block]
      onBlocksChange(updatedBlocks)
      scheduleSaveWithBlocks(updatedBlocks) // SYNCHRONE State-Update, dann Auto-Save
      setSelectedBlockId(data.block.id)
      setShowBlockPicker(false)
      // No notification for auto-save (silent)
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Erstellen", "error")
    }
  }

  async function handleUpdateBlock(blockId: string, updates: Partial<Block>) {
    try {
      // Check if block still exists
      const blockExists = blocks.some(b => b.id === blockId)
      if (!blockExists) {
        console.warn(`Block ${blockId} not found, skipping update`)
        return
      }

      const response = await fetch(`/api/app/dpp/${dppId}/content/blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Block was deleted, remove from local state
          const updatedBlocks = blocks.filter(b => b.id !== blockId)
          onBlocksChange(updatedBlocks)
          console.warn(`Block ${blockId} was deleted, removed from local state`)
          return
        }
        const error = await response.json().catch(() => ({ error: "Fehler beim Aktualisieren" }))
        throw new Error(error.error || "Fehler beim Aktualisieren")
      }

      // CRITICAL: Server response is ignored - we use the updates we sent
      // Client draft (blocks) is the single source of truth
      const updatedBlocks = blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
      onBlocksChange(updatedBlocks) // SYNCHRONE State-Update
      scheduleSaveWithBlocks(updatedBlocks) // Auto-Save mit aktuellen Daten
      // No notification for auto-save (silent)
    } catch (error: any) {
      console.error("Error updating block:", error)
      showNotification(error.message || "Fehler beim Aktualisieren", "error")
    }
  }

  function handleDeleteClick(blockId: string) {
    setDeleteConfirmBlockId(blockId)
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirmBlockId) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/blocks/${deleteConfirmBlockId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Löschen")
      }

      const updatedBlocks = blocks.filter(b => b.id !== deleteConfirmBlockId)
      onBlocksChange(updatedBlocks) // SYNCHRONE State-Update
      scheduleSaveWithBlocks(updatedBlocks) // Auto-Save mit aktuellen Daten
      if (selectedBlockId === deleteConfirmBlockId) {
        setSelectedBlockId(null)
      }
      setDeleteConfirmBlockId(null)
      // No notification for auto-save (silent)
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Löschen", "error")
    } finally {
      setDeleting(false)
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
      const updatedBlocks = data.blocks
      onBlocksChange(updatedBlocks) // SYNCHRONE State-Update
      scheduleSaveWithBlocks(updatedBlocks) // Auto-Save mit aktuellen Daten
      // No notification for auto-save (silent)
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Neuordnen", "error")
    }
  }

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
    handleReorderBlocks(newOrder)
    setDraggedBlockId(null)
  }

  function handleDragEnd() {
    setDraggedBlockId(null)
    setDragOverIndex(null)
  }

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF"
      }}>
        <LoadingSpinner message="Lade Content..." />
      </div>
    )
  }

  return (
    <>
      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmBlockId !== null}
        title="Block löschen"
        message="Möchten Sie diesen Block wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmBlockId(null)}
      />

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "2rem",
        backgroundColor: "#FFFFFF"
      }}>
        {/* Header - Auto-Save: No manual save button */}
        <div style={{
          marginBottom: "2rem"
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Content Editor
          </h2>
          <p style={{
            fontSize: "0.875rem",
            color: "#7A7A7A",
            margin: 0
          }}>
            Zusätzliche Inhalte für Ihren Digitalen Produktpass, die nach den Pflichtinformationen angezeigt werden
          </p>
        </div>

        {/* Content Blocks Section */}
        <div>

          {sortedBlocks.length === 0 ? (
              <button
                onClick={() => setShowBlockPicker(true)}
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  backgroundColor: "#FFFFFF",
                  border: "2px dashed #E5E5E5",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  color: "#7A7A7A",
                  fontSize: "0.875rem",
                  fontWeight: "500"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#E20074"
                  e.currentTarget.style.backgroundColor = "#FFF5F9"
                  e.currentTarget.style.color = "#E20074"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E5E5"
                  e.currentTarget.style.backgroundColor = "#FFFFFF"
                  e.currentTarget.style.color = "#7A7A7A"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Block hinzufügen</span>
              </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sortedBlocks.map((block, index) => (
                <div 
                  key={block.id} 
                  style={{ 
                    position: "relative",
                    opacity: draggedBlockId === block.id ? 0.5 : 1,
                    transition: "opacity 0.2s"
                  }}
                >
                  {/* Drop Indicator */}
                  {dragOverIndex === index && draggedBlockId !== block.id && (
                    <div style={{
                      position: "absolute",
                      top: "-4px",
                      left: 0,
                      right: 0,
                      height: "3px",
                      backgroundColor: "#E20074",
                      borderRadius: "2px",
                      zIndex: 10,
                      boxShadow: "0 0 8px rgba(226, 0, 116, 0.4)"
                    }} />
                  )}
                  <div style={{
                    backgroundColor: "#FFFFFF",
                    border: dragOverIndex === index && draggedBlockId !== block.id 
                      ? "1px solid #E20074" 
                      : "1px solid #E5E5E5",
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "all 0.2s"
                  }}>
                    <ContentBlockCard
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      isDragging={draggedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                      onDelete={() => handleDeleteClick(block.id)}
                      onDragStart={(e) => handleDragStart(e, block.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      dppId={dppId}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowBlockPicker(true)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  backgroundColor: "#FFFFFF",
                  border: "2px dashed #E5E5E5",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  color: "#7A7A7A",
                  fontSize: "0.875rem",
                  fontWeight: "500"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#E20074"
                  e.currentTarget.style.backgroundColor = "#FFF5F9"
                  e.currentTarget.style.color = "#E20074"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E5E5"
                  e.currentTarget.style.backgroundColor = "#FFFFFF"
                  e.currentTarget.style.color = "#7A7A7A"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Block hinzufügen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <BlockPickerModal
          availableFeatures={availableFeatures}
          onSelectBlock={handleAddBlock}
          onClose={() => setShowBlockPicker(false)}
        />
      )}
    </>
  )
}
