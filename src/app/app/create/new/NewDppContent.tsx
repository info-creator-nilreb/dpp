"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import DppEditor from "@/components/DppEditor"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface NewDppContentProps {
  availableCategories: Array<{ categoryKey: string; label: string }>
  initialOrganizations?: Array<{ id: string; name: string }>
}

// Lade Prefill-Daten von KI-Assist (falls vorhanden)
interface PrefillData {
  name?: string
  description?: string
  category?: string
  sku?: string
  gtin?: string
  brand?: string
  countryOfOrigin?: string
  materials?: string
  materialSource?: string
  careInstructions?: string
  isRepairable?: boolean | null
  sparePartsAvailable?: boolean | null
  lifespan?: string
  conformityDeclaration?: string
  disposalInfo?: string
  takebackOffered?: boolean | null
  takebackContact?: string
  secondLifeInfo?: string
}

export default function NewDppContent({ availableCategories, initialOrganizations = [] }: NewDppContentProps) {
  const router = useRouter()
  const backLinkRef = useRef<HTMLAnchorElement>(null)
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>(initialOrganizations)
  const [loading, setLoading] = useState(initialOrganizations.length === 0)
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null)
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  
  // Prüft ob der DppEditor ungespeicherte Änderungen hat
  // Wir können dies nur durch einen Callback vom DppEditor erfahren
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Lade Organizations nur wenn nicht bereits vom Server geladen
  useEffect(() => {
    if (initialOrganizations.length > 0) {
      setLoading(false)
      return
    }
    
    async function loadOrganizations() {
      try {
        const response = await fetch("/api/app/organizations", {
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          setOrganizations(data.organizations || [])
        }
      } catch (error) {
        // Silent fail - organizations bleiben leer
      } finally {
        setLoading(false)
      }
    }
    loadOrganizations()
  }, [initialOrganizations.length])

  // Load prefilled data from preflight analysis (if available)
  useEffect(() => {
    try {
      const prefillDataStr = sessionStorage.getItem("preflightPrefillData")
      if (prefillDataStr) {
        const data = JSON.parse(prefillDataStr)
        setPrefillData(data)
        // Store prefilled field names for DppEditor hints
        const prefilledFields = Object.keys(data).filter(key => key !== "category" && data[key])
        sessionStorage.setItem("preflightPrefilledFields", JSON.stringify(prefilledFields))
        // Clear prefill data after reading (one-time use)
        sessionStorage.removeItem("preflightPrefillData")
      }
    } catch (prefillError) {
      console.error("Error loading prefill data:", prefillError)
      // Clear invalid data
      sessionStorage.removeItem("preflightPrefillData")
      sessionStorage.removeItem("preflightPrefilledFields")
    }
  }, [])
  
  // Browser beforeunload Event (MUST be before early returns)
  useEffect(() => {
    if (!hasUnsavedChanges) return
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
      return ""
    }
    
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Loading state
  if (loading) {
    return (
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        padding: "2rem"
      }}>
        <LoadingSpinner message="Daten werden geladen..." />
      </div>
    )
  }

  // Wenn keine Organisation vorhanden, zeige Hinweis statt Redirect
  if (organizations.length === 0) {
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
          Um einen Produktpass zu erstellen, benötigen Sie eine Organisation.
        </p>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          marginBottom: "1.5rem"
        }}>
          Bitte erstellen Sie zuerst eine Organisation in Ihren Kontoeinstellungen.
        </p>
        <a
          href="/app/account"
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
          Zu Kontoeinstellungen
        </a>
      </div>
    )
  }

  // Wenn keine veröffentlichten Templates vorhanden sind, zeige leeren Zustand
  if (availableCategories.length === 0) {
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
          Keine Templates verfügbar
        </p>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          marginBottom: "1.5rem"
        }}>
          Es sind derzeit keine veröffentlichten Templates verfügbar. Bitte kontaktieren Sie einen Administrator, um Templates zu veröffentlichen.
        </p>
      </div>
    )
  }

  // Erstelle DPP-Objekt für Neuanlage (mit Prefill-Daten falls vorhanden)
  const emptyDpp = {
    id: "new", // Temporäre ID
    name: prefillData?.name || "",
    description: prefillData?.description || null,
    category: (prefillData?.category && availableCategories.some(cat => cat.categoryKey === prefillData.category))
      ? prefillData.category
      : (availableCategories[0]?.categoryKey || ""),
    sku: prefillData?.sku || null,
    gtin: prefillData?.gtin || null,
    brand: prefillData?.brand || null,
    countryOfOrigin: prefillData?.countryOfOrigin || null,
    materials: prefillData?.materials || null,
    materialSource: prefillData?.materialSource || null,
    careInstructions: prefillData?.careInstructions || null,
    isRepairable: prefillData?.isRepairable !== undefined && prefillData?.isRepairable !== null 
      ? String(prefillData.isRepairable) 
      : null,
    sparePartsAvailable: prefillData?.sparePartsAvailable !== undefined && prefillData?.sparePartsAvailable !== null
      ? String(prefillData.sparePartsAvailable)
      : null,
    lifespan: prefillData?.lifespan || null,
    conformityDeclaration: prefillData?.conformityDeclaration || null,
    disposalInfo: prefillData?.disposalInfo || null,
    takebackOffered: prefillData?.takebackOffered !== undefined && prefillData?.takebackOffered !== null
      ? String(prefillData.takebackOffered)
      : null,
    takebackContact: prefillData?.takebackContact || null,
    secondLifeInfo: prefillData?.secondLifeInfo || null,
    status: "DRAFT",
    organizationId: organizations[0]?.id || "",
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: {
      id: organizations[0]?.id || "",
      name: organizations[0]?.name || ""
    },
    media: []
  }

  // Navigation-Handler für Back-Link
  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges) {
      e.preventDefault()
      setPendingNavigation("/app/create")
      setShowLeaveWarning(true)
    }
    // Wenn keine ungespeicherten Änderungen, Link funktioniert normal
  }

  return (
    <>
      <div style={{
        marginBottom: "1rem"
      }}>
        <a
          ref={backLinkRef}
          href="/app/create"
          onClick={handleBackClick}
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            cursor: "pointer"
          }}
        >
          ← Zurück zur Übersicht
        </a>
      </div>
      <DppEditor 
        dpp={emptyDpp} 
        isNew={true}
        onUnsavedChangesChange={setHasUnsavedChanges}
        availableCategories={availableCategories}
      />
      
      {/* Warnung beim Verlassen */}
      {showLeaveWarning && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "clamp(1.5rem, 4vw, 2rem)",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
          }}>
            <h3 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#0A0A0A",
              marginBottom: "1rem"
            }}>
              Seite verlassen?
            </h3>
            <p style={{
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              color: "#7A7A7A",
              marginBottom: "1.5rem",
              lineHeight: "1.6"
            }}>
              Sie haben die Daten noch nicht gespeichert. Beim Verlassen der Seite gehen diese verloren.
            </p>
            <div style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => {
                  setShowLeaveWarning(false)
                  setPendingNavigation(null)
                }}
                style={{
                  padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  backgroundColor: "#FFFFFF",
                  color: "#0A0A0A",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowLeaveWarning(false)
                  if (pendingNavigation) {
                    router.push(pendingNavigation)
                  } else {
                    router.back()
                  }
                  setPendingNavigation(null)
                }}
                style={{
                  padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  backgroundColor: "#24c598",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(36, 197, 152, 0.3)"
                }}
              >
                Trotzdem verlassen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

