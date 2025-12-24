"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DppEditor from "@/components/DppEditor"

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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <p style={{ color: "#7A7A7A" }}>Lade Daten...</p>
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

  // Erstelle leeres DPP-Objekt für Neuanlage
  const emptyDpp = {
    id: "new", // Temporäre ID
    name: "",
    description: null,
    category: (availableCategories[0]?.categoryKey || "OTHER") as const,
    sku: null,
    gtin: null,
    brand: null,
    countryOfOrigin: null,
    materials: null,
    materialSource: null,
    careInstructions: null,
    isRepairable: null,
    sparePartsAvailable: null,
    lifespan: null,
    conformityDeclaration: null,
    disposalInfo: null,
    takebackOffered: null,
    takebackContact: null,
    secondLifeInfo: null,
    status: "DRAFT",
    organizationId: organizations[0].id,
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: {
      id: organizations[0].id,
      name: organizations[0].name
    },
    media: []
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
      <DppEditor dpp={emptyDpp} isNew={true} />
    </>
  )
}

