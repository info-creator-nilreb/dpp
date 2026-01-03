"use client"

/**
 * Global Editor State Context
 * 
 * Manages save/publish state and logic for the DPP editor.
 * Used by EditorHeader and DppEditor components.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useNotification } from "@/components/NotificationProvider"

export type SaveStatus = "idle" | "saving" | "saved" | "publishing" | "error"
export type EditorStatus = "draft" | "published" | "published_with_hints" | "error"

interface EditorStateContextValue {
  // State
  saveStatus: SaveStatus
  lastSaved: Date | null
  saveError: string | null
  editorStatus: EditorStatus
  hints: string[]
  
  // Actions
  handleSave: (saveData: () => Promise<{ success: boolean; dppId?: string }>) => Promise<void>
  handlePublish: (publishData: () => Promise<{ success: boolean; dppId?: string; version?: number }>) => Promise<void>
  setLastSaved: (date: Date | null) => void
  setEditorStatus: (status: EditorStatus) => void
  setHints: (hints: string[]) => void
  resetError: () => void
}

const EditorStateContext = createContext<EditorStateContextValue | undefined>(undefined)

export function useEditorState() {
  const context = useContext(EditorStateContext)
  if (!context) {
    throw new Error("useEditorState must be used within EditorStateProvider")
  }
  return context
}

interface EditorStateProviderProps {
  children: ReactNode
  isNew: boolean
  canPublish: boolean
  subscriptionCanPublish?: boolean
  initialLastSaved?: Date | null
}

export function EditorStateProvider({
  children,
  isNew,
  canPublish,
  subscriptionCanPublish = true,
  initialLastSaved = null
}: EditorStateProviderProps) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(initialLastSaved)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editorStatus, setEditorStatus] = useState<EditorStatus>("draft")
  const [hints, setHints] = useState<string[]>([])

  const handleSave = useCallback(async (saveData: () => Promise<{ success: boolean; dppId?: string }>) => {
    setSaveStatus("saving")
    setSaveError(null)
    
    try {
      const result = await saveData()
      
      if (result.success) {
        setLastSaved(new Date())
        setSaveStatus("saved")
        showNotification("Entwurf gespeichert", "success")
        
        // If new DPP was created, redirect to edit page
        if (isNew && result.dppId) {
          router.replace(`/app/dpps/${result.dppId}`)
        }
      } else {
        setSaveStatus("error")
      }
    } catch (error: any) {
      const errorMsg = error.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
      setSaveError(errorMsg)
      setSaveStatus("error")
      showNotification(errorMsg, "error")
    }
  }, [isNew, router, showNotification])

  const handlePublish = useCallback(async (publishData: () => Promise<{ success: boolean; dppId?: string; version?: number }>) => {
    if (!canPublish) {
      showNotification("Produktname ist erforderlich für die Veröffentlichung", "error")
      return
    }

    setSaveStatus("publishing")
    setSaveError(null)
    
    try {
      const result = await publishData()
      
      if (result.success) {
        setLastSaved(new Date())
        setEditorStatus("published")
        setSaveStatus("saved")
        
        if (result.version) {
          showNotification(`Produktpass erfolgreich als Version ${result.version} veröffentlicht!`, "success")
          if (result.dppId) {
            router.replace(`/app/dpps/${result.dppId}/versions/${result.version}`)
          }
        } else {
          showNotification("Produktpass erfolgreich veröffentlicht!", "success")
        }
      } else {
        setSaveStatus("error")
      }
    } catch (error: any) {
      const errorMsg = error.message || "Ein Fehler ist aufgetreten"
      setSaveError(errorMsg)
      setSaveStatus("error")
      showNotification(errorMsg, "error")
    }
  }, [canPublish, router, showNotification])

  const resetError = useCallback(() => {
    setSaveError(null)
    if (saveStatus === "error") {
      setSaveStatus("idle")
    }
  }, [saveStatus])

  const value: EditorStateContextValue = {
    saveStatus,
    lastSaved,
    saveError,
    editorStatus,
    hints,
    handleSave,
    handlePublish,
    setLastSaved,
    setEditorStatus,
    setHints,
    resetError
  }

  return (
    <EditorStateContext.Provider value={value}>
      {children}
    </EditorStateContext.Provider>
  )
}

