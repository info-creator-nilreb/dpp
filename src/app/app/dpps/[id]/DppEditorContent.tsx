"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DppEditorTabs from "@/components/dpp/DppEditorTabs"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import EditorHeader from "@/components/dpp/EditorHeader"

interface DppEditorContentProps {
  id: string
}

export default function DppEditorContent({ id }: DppEditorContentProps) {
  const router = useRouter()
  const [dpp, setDpp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([])
  const [organizationId, setOrganizationId] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  
  // Editor state for header
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "publishing" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editorStatus, setEditorStatus] = useState<"draft" | "published" | "published_with_hints" | "error">("draft")
  const [subscriptionCanPublish, setSubscriptionCanPublish] = useState<boolean>(true)
  
  // Note: We don't need dppEditorRef anymore since we use onSave/onPublish props

  useEffect(() => {
    async function loadDpp() {
      if (!id) {
        setError("Keine DPP-ID angegeben")
        setLoading(false)
        return
      }
      
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
          let errorMessage = "Fehler beim Laden des Produktpasses"
          try {
            const errorData = await dppResponse.json()
            console.error("DPP EDIT: Error loading DPP:", errorData)
            errorMessage = errorData.error || errorMessage
          } catch (parseError) {
            console.error("DPP EDIT: Could not parse error response:", parseError)
            errorMessage = `HTTP ${dppResponse.status}: ${dppResponse.statusText}`
          }
          setError(errorMessage)
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
          })),
          // Pflichtdaten-Tab: Feldwerte aus API (technical keys / template keys)
          _fieldValues: data.fieldValues ?? {},
          _fieldInstances: data.fieldInstances ?? {},
        }
        
        setDpp(normalizedDpp)
        setOrganizationId(normalizedDpp.organizationId)
        setLastSaved(normalizedDpp.updatedAt)
        setEditorStatus(normalizedDpp.status === "PUBLISHED" ? "published" : "draft")
        
        // Load user ID and capabilities in parallel
        const [accountResponse, capabilitiesResponse] = await Promise.all([
          fetch("/api/app/account", { cache: "no-store" }),
          fetch(`/api/app/capabilities/check?organizationId=${normalizedDpp.organizationId}`, { cache: "no-store" })
        ])
        
        if (accountResponse.ok) {
          const accountData = await accountResponse.json()
          setUserId(accountData.id || "")
        }
        
        if (capabilitiesResponse.ok) {
          const capabilitiesData = await capabilitiesResponse.json()
          setAvailableFeatures(capabilitiesData.features || [])
          
          // Check if subscription allows publishing
          // Fetch subscription info to check trial status
          try {
            const subscriptionResponse = await fetch(`/api/app/dpp/${id}/capabilities`, { cache: "no-store" })
            if (subscriptionResponse.ok) {
              const subData = await subscriptionResponse.json()
              // Publishing is disabled if status is trial_active or if publishing capability is false
              const isTrial = subData.subscription?.status === "trial_active" || subData.subscription?.status === "trial"
              const hasPublishing = subData.capabilities?.publishing !== false
              setSubscriptionCanPublish(!isTrial && hasPublishing)
            } else {
              // Default to false if we can't check (safer)
              setSubscriptionCanPublish(false)
            }
          } catch (subError) {
            console.error("Error checking subscription:", subError)
            // Default to false if we can't check (safer)
            setSubscriptionCanPublish(false)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error("DPP EDIT: Error loading DPP:", error)
        setError("Fehler beim Laden des Produktpasses")
        setLoading(false)
      }
    }
    
    if (id) {
      loadDpp()
    } else {
      setError("Keine DPP-ID angegeben")
      setLoading(false)
    }
  }, [id, router])

  if (loading) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF"
      }}>
        <LoadingSpinner message="Lade Produktpass..." />
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

  // Handler functions that will be passed to DppEditor
  // These are called by DppEditor's performAutoSave when externalOnSave is provided
  const handleSave = async () => {
    if (!dpp?.id) return
    
    setSaveStatus("saving")
    setSaveError(null)
    
    try {
      const response = await fetch(`/api/app/dpp/${dpp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dpp.name,
          description: dpp.description,
          category: dpp.category,
          sku: dpp.sku,
          gtin: dpp.gtin,
          brand: dpp.brand,
          countryOfOrigin: dpp.countryOfOrigin,
          materials: dpp.materials,
          materialSource: dpp.materialSource,
          careInstructions: dpp.careInstructions,
          isRepairable: dpp.isRepairable,
          sparePartsAvailable: dpp.sparePartsAvailable,
          lifespan: dpp.lifespan,
          conformityDeclaration: dpp.conformityDeclaration,
          disposalInfo: dpp.disposalInfo,
          takebackOffered: dpp.takebackOffered,
          takebackContact: dpp.takebackContact,
          secondLifeInfo: dpp.secondLifeInfo
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Fehler beim Speichern" }))
        throw new Error(errorData.error || "Fehler beim Speichern")
      }

      const savedDate = new Date()
      setLastSaved(savedDate)
      setSaveStatus("saved")
      // Reload DPP to get latest data
      const dppResponse = await fetch(`/api/app/dpp/${dpp.id}`, { cache: "no-store" })
      if (dppResponse.ok) {
        const dppData = await dppResponse.json()
        setDpp(dppData.dpp)
      }
    } catch (error: any) {
      const errorMsg = error.message || "Fehler beim Speichern"
      setSaveError(errorMsg)
      setSaveStatus("error")
      throw error
    }
  }

  const handlePublish = async () => {
    if (!dpp?.id) return
    
    setSaveStatus("publishing")
    setSaveError(null)
    
    try {
      const response = await fetch(`/api/app/dpp/${dpp.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Fehler beim Veröffentlichen" }))
        throw new Error(errorData.error || "Fehler beim Veröffentlichen")
      }

      const data = await response.json()
      setEditorStatus("published")
      setSaveStatus("saved")
      setLastSaved(new Date())
      
      // Reload DPP to get latest data
      const dppResponse = await fetch(`/api/app/dpp/${dpp.id}`, { cache: "no-store" })
      if (dppResponse.ok) {
        const dppData = await dppResponse.json()
        setDpp(dppData.dpp)
      }
    } catch (error: any) {
      const errorMsg = error.message || "Fehler beim Veröffentlichen"
      setSaveError(errorMsg)
      setSaveStatus("error")
      throw error
    }
  }

  const canPublish = dpp?.name?.trim() ? true : false

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Global Editor Header */}
      <EditorHeader
        status={editorStatus}
        lastSaved={lastSaved}
        onPublish={handlePublish}
        isNew={false}
        canPublish={canPublish}
        subscriptionCanPublish={subscriptionCanPublish}
        error={saveError}
        isProcessing={saveStatus === "publishing"}
        hints={[]}
        autoSaveStatus={saveStatus === "saving" ? "saving" : saveStatus === "saved" ? "saved" : saveStatus === "error" ? "error" : "idle"}
        onRetrySave={saveStatus === "error" ? handleSave : undefined}
      />

      {/* Breadcrumb Navigation - positioned below header */}
      <div style={{
        marginBottom: "1rem",
        padding: "0 1.5rem",
        paddingTop: "1.5rem",
        flexShrink: 0,
        marginTop: "20px" // Space for fixed header (reduced for better spacing)
      }}>
        <Link
          href="/app/dpps"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      {/* Tab-based Editor */}
      <div className="flex-1 overflow-hidden min-h-0">
        {dpp && (
          <DppEditorTabs
            dpp={dpp}
            organizationId={organizationId}
            userId={userId}
            availableFeatures={availableFeatures}
            onSave={handleSave}
            onPublish={handlePublish}
            onStatusChange={setSaveStatus}
            onLastSavedChange={setLastSaved}
            onErrorChange={setSaveError}
            onDppUpdate={(updatedDpp) => {
              // CRITICAL: Update global dpp state after auto-save
              // This ensures tab switches don't reset the draft state
              // SINGLE SOURCE OF TRUTH: This is the only place where dpp state is updated
              setDpp(updatedDpp)
            }}
          />
        )}
      </div>
    </div>
  )
}

