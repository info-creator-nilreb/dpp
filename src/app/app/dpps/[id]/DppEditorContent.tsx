"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DppEditor from "@/components/DppEditor"

interface DppEditorContentProps {
  id: string
}

export default function DppEditorContent({ id }: DppEditorContentProps) {
  const router = useRouter()
  const [dpp, setDpp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debug: Log beim ersten Render
  console.log("[DppEditorContent] Component rendered with id:", id, "loading:", loading, "dpp:", dpp?.id || "null")
  
  // WICHTIG: Prüfe ob id vorhanden ist
  if (!id || id === "undefined" || id === "") {
    console.error("[DppEditorContent] ERROR: id is missing, undefined, or empty:", id)
    return (
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(2rem, 5vw, 4rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        textAlign: "center"
      }}>
        <p style={{
          color: "#DC2626",
          fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
          marginBottom: "1rem"
        }}>
          Fehler: DPP-ID fehlt oder ist ungültig
        </p>
        <a
          href="/app/dpps"
          style={{
            display: "inline-block",
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)"
          }}
        >
          Zurück zur Übersicht
        </a>
      </div>
    )
  }

  useEffect(() => {
    console.log("[DppEditorContent] useEffect triggered for id:", id)
    async function loadDpp() {
      try {
        console.log("[DppEditorContent] START: Loading DPP with id:", id)
        console.log("[DppEditorContent] API URL:", `/api/app/dpp/${id}`)
        const dppResponse = await fetch(`/api/app/dpp/${id}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        })
        
        console.log("[DppEditorContent] Response status:", dppResponse.status)
        console.log("[DppEditorContent] Response ok:", dppResponse.ok)
        
        if (!dppResponse.ok) {
          if (dppResponse.status === 404 || dppResponse.status === 403) {
            console.error("[DppEditorContent] Access denied or not found, redirecting")
            window.location.href = "/app/dpps"
            return
          }
          let errorMessage = "Fehler beim Laden des Produktpasses"
          try {
            const errorData = await dppResponse.json()
            console.error("[DppEditorContent] Error loading DPP:", errorData)
            errorMessage = errorData.error || errorMessage
          } catch (parseError) {
            console.error("[DppEditorContent] Could not parse error response:", parseError)
            errorMessage = `HTTP ${dppResponse.status}: ${dppResponse.statusText}`
          }
          setError(errorMessage)
          setLoading(false)
          return
        }
        
        const data = await dppResponse.json()
        console.log("[DppEditorContent] DPP loaded successfully:", data.dpp?.id, data.dpp?.name)
        console.log("[DppEditorContent] fieldValues:", data.fieldValues)
        console.log("[DppEditorContent] fieldInstances:", data.fieldInstances)
        
        // Normalize category to expected union type for Dpp
        const categoryValues = ["TEXTILE", "FURNITURE", "OTHER"] as const
        type CategoryType = typeof categoryValues[number]
        const normalizedDpp = {
          ...data.dpp,
          category: categoryValues.includes(data.dpp.category as CategoryType)
            ? (data.dpp.category as CategoryType)
            : "OTHER",
          createdAt: new Date(data.dpp.createdAt),
          updatedAt: new Date(data.dpp.updatedAt),
          media: data.dpp.media.map((m: any) => ({
            ...m,
            uploadedAt: new Date(m.uploadedAt)
          })),
          // Füge fieldValues und fieldInstances zum DPP-Objekt hinzu, damit sie später geladen werden können
          _fieldValues: data.fieldValues || {},
          _fieldInstances: data.fieldInstances || {}
        }
        
        console.log("[DppEditorContent] Setting dpp state with:", {
          id: normalizedDpp.id,
          name: normalizedDpp.name,
          hasFieldValues: !!normalizedDpp._fieldValues,
          hasFieldInstances: !!normalizedDpp._fieldInstances
        })
        setDpp(normalizedDpp)
        setLoading(false)
      } catch (error) {
        console.error("[DppEditorContent] Error loading DPP:", error)
        setError("Fehler beim Laden des Produktpasses")
        setLoading(false)
      }
    }
    
    loadDpp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // router ist stabil und muss nicht in Dependencies sein

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <p style={{ color: "#7A7A7A" }}>Lade Produktpass...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(2rem, 5vw, 4rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        textAlign: "center"
      }}>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
          marginBottom: "1rem"
        }}>
          {error}
        </p>
        <a
          href="/app/dpps"
          style={{
            display: "inline-block",
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)"
          }}
        >
          Zurück zur Übersicht
        </a>
      </div>
    )
  }

  if (!dpp) {
    return (
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(2rem, 5vw, 4rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        textAlign: "center"
      }}>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
          marginBottom: "1rem"
        }}>
          Produktpass nicht gefunden
        </p>
        <a
          href="/app/dpps"
          style={{
            display: "inline-block",
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)"
          }}
        >
          Zurück zur Übersicht
        </a>
      </div>
    )
  }

  return (
    <>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1rem",
        flexWrap: "wrap"
      }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zum Dashboard
        </Link>
        <span style={{ color: "#CDCDCD" }}>|</span>
        <Link
          href="/app/dpps"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          Zur Übersicht
        </Link>
      </div>
      {console.log("[DppEditorContent] Rendering DppEditor with dpp:", {
        id: dpp?.id,
        name: dpp?.name,
        hasFieldValues: !!(dpp as any)?._fieldValues,
        hasFieldInstances: !!(dpp as any)?._fieldInstances,
        fieldValuesCount: Object.keys((dpp as any)?._fieldValues || {}).length,
        fieldInstancesCount: Object.keys((dpp as any)?._fieldInstances || {}).length
      })}
      <DppEditor dpp={dpp} isNew={false} />
    </>
  )
}

