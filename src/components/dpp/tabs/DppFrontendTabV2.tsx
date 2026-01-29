"use client"

/**
 * DPP Frontend Tab - Refactored
 * 
 * Shows preview + styling editor (if Premium)
 * - Preview is visible for all users
 * - Styling editor only for Premium users
 */

import { StylingConfig, Block } from "@/lib/cms/types"
import StylingEditor from "@/components/cms/StylingEditor"
import DppFrontendPreview from "./DppFrontendPreview"
import { useNotification } from "@/components/NotificationProvider"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useState, useEffect, useRef } from "react"
import { useAutoSave } from "@/hooks/useAutoSave"

interface DppFrontendTabV2Props {
  dpp: any
  dppId: string
  organizationId: string
  userId: string
  styling: StylingConfig | null
  blocks: Block[]
  onStylingChange: (styling: StylingConfig) => void
  availableFeatures: string[]
  loading: boolean
  onReload: () => void
  onStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void
  onLastSavedChange?: (date: Date | null) => void
}

export default function DppFrontendTabV2({
  dpp,
  dppId,
  styling,
  blocks,
  onStylingChange,
  availableFeatures,
  loading,
  onStatusChange,
  onLastSavedChange
}: DppFrontendTabV2Props) {
  const { showNotification } = useNotification()
  const [isMobile, setIsMobile] = useState(false)
  const stylingRef = useRef(styling)
  const hasChangesRef = useRef(false)

  // Update ref when styling changes
  useEffect(() => {
    stylingRef.current = styling
  }, [styling])
  
  // Check if user has styling access
  // Debug: Log available features to help diagnose issues
  useEffect(() => {
    if (availableFeatures.length > 0) {
      console.log("[DppFrontendTabV2] Available features:", availableFeatures)
      console.log("[DppFrontendTabV2] Has cms_styling:", availableFeatures.includes("cms_styling"))
      console.log("[DppFrontendTabV2] All features:", JSON.stringify(availableFeatures, null, 2))
    }
  }, [availableFeatures])
  
  const hasStyling = availableFeatures.includes("cms_styling")
  
  // Don't show styling section at all if not available - no upgrade hint

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Auto-Save: Save styling changes
  const performAutoSave = async () => {
    if (!hasChangesRef.current) return

    const currentStyling = stylingRef.current || {
      colors: {
        primary: "#0A0A0A",
        secondary: "#7A7A7A",
        accent: "#24c598"
      }
    }

    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/styling`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentStyling)
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Ungültige Antwort vom Server. Bitte versuchen Sie es erneut.")
        }
        let error
        try {
          error = await response.json()
        } catch {
          throw new Error(`Fehler beim Aktualisieren (Status: ${response.status})`)
        }
        throw new Error(error.error || "Fehler beim Aktualisieren")
      }

      let data
      try {
        data = await response.json()
      } catch {
        throw new Error("Fehler beim Verarbeiten der Antwort")
      }

      // Update with server response
      const savedStyling = data.styling || currentStyling
      onStylingChange(savedStyling)
      stylingRef.current = savedStyling
      hasChangesRef.current = false
      const savedDate = new Date()
      onLastSavedChange?.(savedDate)
      // No notification for auto-save (silent)
    } catch (error: any) {
      showNotification("Auto-Save fehlgeschlagen. Bitte versuchen Sie es erneut.", "error")
      throw error
    }
  }

  // Auto-Save hook
  // Optimized for Shopify/Shopware-level UX - immediate save after logo upload
  const { scheduleSave, triggerSave } = useAutoSave({
    onSave: performAutoSave,
    enabled: true,
    debounceMs: 500, // Short debounce for instant feel
    onStatusChange: (status) => {
      onStatusChange?.(status)
    }
  })

  async function handleUpdateStyling(updates: Partial<StylingConfig>) {
    // Optimistically update local state for immediate preview feedback
    const currentStyling = stylingRef.current || styling || {
      colors: {
        primary: "#0A0A0A",
        secondary: "#7A7A7A",
        accent: "#24c598"
      }
    }
    const optimisticStyling: StylingConfig = {
      ...currentStyling,
      ...updates,
      colors: {
        ...currentStyling.colors,
        ...(updates.colors || {})
      },
      logo: updates.logo !== undefined ? updates.logo : currentStyling.logo
    }
    
    // Update ref FIRST so auto-save uses the correct value
    stylingRef.current = optimisticStyling
    hasChangesRef.current = true
    
    // Then update UI state
    onStylingChange(optimisticStyling)
    
    // For logo uploads, trigger immediate save (no debounce)
    // For other changes, use debounced save
    if (updates.logo !== undefined) {
      // Logo upload: Save immediately for instant feedback
      triggerSave()
    } else {
      // Color changes: Use debounced save
      scheduleSave()
    }
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
        <LoadingSpinner message="Vorschau wird generiert..." />
      </div>
    )
  }

  // Mobile: Stack vertically
  if (isMobile) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        minHeight: 0
      }}>
        {/* Preview Section - Always visible */}
        <div style={{
          flex: 1,
          overflow: "hidden",
          minHeight: 0
        }}>
          <div style={{
            padding: "1rem",
            borderBottom: "1px solid #E5E5E5",
            backgroundColor: "#F9F9F9"
          }}>
            <h3 style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#0A0A0A",
              margin: 0
            }}>
              Vorschau
            </h3>
            <p style={{
              fontSize: "0.75rem",
              color: "#7A7A7A",
              margin: "0.25rem 0 0 0"
            }}>
              So wird Ihr Digitaler Produktpass angezeigt
            </p>
          </div>
          <DppFrontendPreview
            dpp={dpp}
            blocks={blocks}
            styling={styling}
          />
        </div>

        {/* Styling Editor Section - Only for Premium, shown below preview on mobile */}
        {hasStyling && (
          <div style={{
            maxHeight: "50vh",
            overflowY: "auto",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #E5E5E5"
          }}>
            <div style={{
              padding: "1rem",
              borderBottom: "1px solid #E5E5E5",
              backgroundColor: "#F9F9F9",
              position: "sticky",
              top: 0,
              zIndex: 10
            }}>
              <h3 style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#0A0A0A",
                margin: 0
              }}>
                Styling
              </h3>
              <p style={{
                fontSize: "0.75rem",
                color: "#7A7A7A",
                margin: "0.25rem 0 0 0"
              }}>
                Logo, Farben und Schrift anpassen
              </p>
            </div>
            <div style={{ padding: "1rem" }}>
              <StylingEditor
                styling={styling}
                onUpdate={handleUpdateStyling}
                dppId={dppId}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop: Side by side
  return (
    <div style={{
      display: "flex",
      flex: 1,
      overflow: "hidden",
      minHeight: 0
    }}>
      {/* Preview Section - Always visible */}
      <div style={{
        flex: 1,
        overflow: "hidden",
        minWidth: 0,
        borderRight: hasStyling ? "1px solid #E5E5E5" : "none"
      }}>
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid #E5E5E5",
          backgroundColor: "#F9F9F9"
        }}>
          <h3 style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#0A0A0A",
            margin: 0
          }}>
            Vorschau
          </h3>
          <p style={{
            fontSize: "0.875rem",
            color: "#7A7A7A",
            margin: "0.25rem 0 0 0"
          }}>
            So wird Ihr Digitaler Produktpass angezeigt
          </p>
        </div>
        <DppFrontendPreview
          dpp={dpp}
          blocks={blocks}
          styling={styling}
        />
      </div>

      {/* Styling Editor Section - Only for Premium */}
      {hasStyling && (
        <div style={{
          width: "400px",
          overflowY: "auto",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid #E5E5E5"
        }}>
          <div style={{
            padding: "1.5rem",
            borderBottom: "1px solid #E5E5E5",
            backgroundColor: "#F9F9F9"
          }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              margin: 0
            }}>
              Styling
            </h3>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              margin: "0.25rem 0 0 0"
            }}>
              Logo, Farben und Schrift anpassen
            </p>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <StylingEditor
              styling={styling}
              onUpdate={handleUpdateStyling}
              dppId={dppId}
            />
          </div>
        </div>
      )}
      
    </div>
  )
}
