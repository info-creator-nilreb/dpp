"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DppEditor from "@/components/DppEditor"

interface DppEditorContentProps {
  id: string
}

export default function DppEditorContent({ id }: DppEditorContentProps) {
  const router = useRouter()
  const [dpp, setDpp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDpp() {
      try {
        console.log("DPP EDIT: Loading DPP with id:", id)
        const dppResponse = await fetch(`/api/app/dpp/${id}`, {
          cache: "no-store",
        })
        
        console.log("DPP EDIT: Response status:", dppResponse.status)
        
        if (!dppResponse.ok) {
          if (dppResponse.status === 404 || dppResponse.status === 403) {
            console.error("DPP EDIT: Access denied or not found, redirecting")
            router.replace("/app/dpps")
            return
          }
          const errorData = await dppResponse.json()
          console.error("DPP EDIT: Error loading DPP:", errorData)
          setError(errorData.error || "Fehler beim Laden des Produktpasses")
          setLoading(false)
          return
        }
        
        const data = await dppResponse.json()
        console.log("DPP EDIT: DPP loaded successfully:", data.dpp?.id, data.dpp?.name)
        
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
          }))
        }
        
        setDpp(normalizedDpp)
        setLoading(false)
      } catch (error) {
        console.error("DPP EDIT: Error loading DPP:", error)
        setError("Fehler beim Laden des Produktpasses")
        setLoading(false)
      }
    }
    
    loadDpp()
  }, [id, router])

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
            backgroundColor: "#E20074",
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
            backgroundColor: "#E20074",
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

  return <DppEditor dpp={dpp} isNew={false} />
}

