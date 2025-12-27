"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DppEditor from "@/components/DppEditor"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface NewDppContentProps {
  availableCategories: Array<{ categoryKey: string; label: string }>
}

export default function NewDppContent({ availableCategories }: NewDppContentProps) {
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  // Lade Organizations des Users via API (clientseitig)
  useEffect(() => {
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
        console.error("Error loading organizations:", error)
      } finally {
        setLoading(false)
      }
    }
    loadOrganizations()
  }, [])

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
            backgroundColor: "#E20074",
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
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null)
  
  useEffect(() => {
    // Load prefilled data from preflight analysis (if available)
    try {
      const prefillDataStr = sessionStorage.getItem("preflightPrefillData")
      if (prefillDataStr) {
        const data = JSON.parse(prefillDataStr)
        setPrefillData(data)
        // Clear sessionStorage after reading (one-time use)
        sessionStorage.removeItem("preflightPrefillData")
      }
    } catch (prefillError) {
      console.error("Error loading prefill data:", prefillError)
      // Clear invalid data
      sessionStorage.removeItem("preflightPrefillData")
    }
  }, [])

  // Erstelle DPP-Objekt für Neuanlage (mit Prefill-Daten falls vorhanden)
  const emptyDpp = {
    id: "new", // Temporäre ID
    name: prefillData?.name || "",
    description: prefillData?.description || null,
    category: (prefillData?.category && availableCategories.some(cat => cat.categoryKey === prefillData.category))
      ? prefillData.category
      : (availableCategories[0]?.categoryKey || "OTHER") as "TEXTILE" | "FURNITURE" | "OTHER",
    sku: prefillData?.sku || null,
    gtin: prefillData?.gtin || null,
    brand: prefillData?.brand || null,
    countryOfOrigin: prefillData?.countryOfOrigin || null,
    materials: prefillData?.materials || null,
    materialSource: prefillData?.materialSource || null,
    careInstructions: prefillData?.careInstructions || null,
    isRepairable: prefillData?.isRepairable || null,
    sparePartsAvailable: prefillData?.sparePartsAvailable || null,
    lifespan: prefillData?.lifespan || null,
    conformityDeclaration: prefillData?.conformityDeclaration || null,
    disposalInfo: prefillData?.disposalInfo || null,
    takebackOffered: prefillData?.takebackOffered || null,
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

  return (
    <>
      <div style={{
        marginBottom: "1rem"
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
      <DppEditor dpp={emptyDpp} isNew={true} />
    </>
  )
}

