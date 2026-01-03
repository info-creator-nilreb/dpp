import { useEffect, useRef, useState } from "react"

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error"

interface UseAutoSaveOptions {
  onSave: () => Promise<void>
  enabled?: boolean
  debounceMs?: number
  onStatusChange?: (status: AutoSaveStatus) => void
}

/**
 * useAutoSave Hook
 * 
 * Automatically saves changes after a debounce period
 * Returns current save status
 */
export function useAutoSave({
  onSave,
  enabled = true,
  debounceMs = 1000,
  onStatusChange
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)

  const triggerSave = async () => {
    if (!enabled || isSavingRef.current) return

    isSavingRef.current = true
    setStatus("saving")
    setError(null)
    onStatusChange?.("saving")

    try {
      await onSave()
      setStatus("saved")
      setLastSaved(new Date())
      onStatusChange?.("saved")
    } catch (err: any) {
      setStatus("error")
      setError(err.message || "Fehler beim Speichern")
      onStatusChange?.("error")
    } finally {
      isSavingRef.current = false
    }
  }

  const scheduleSave = () => {
    if (!enabled) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave()
    }, debounceMs)
  }

  // Reset status after showing "saved" for a moment
  useEffect(() => {
    if (status === "saved") {
      const timer = setTimeout(() => {
        setStatus("idle")
        onStatusChange?.("idle")
      }, 2000) // Show "saved" for 2 seconds
      return () => clearTimeout(timer)
    }
  }, [status, onStatusChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    lastSaved,
    error,
    scheduleSave,
    triggerSave: triggerSave // Manual trigger for error recovery
  }
}

