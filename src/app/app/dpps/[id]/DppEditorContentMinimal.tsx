"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useNotification } from "@/components/NotificationProvider"

interface DppEditorContentMinimalProps {
  id: string
}

interface DppData {
  id: string
  name: string
  description: string | null
  category: string
  sku: string | null
  gtin: string | null
  brand: string | null
  countryOfOrigin: string | null
  status: string
  createdAt: string
  updatedAt: string
}

/**
 * PHASE 2 - Erweiterte Implementierung
 * 
 * Phase 2.1: Edit-Funktionalität (Speichern von Änderungen)
 * Phase 2.2: SupplierInvitation (später, ohne Fetch zu blockieren)
 */
export default function DppEditorContentMinimal({ id }: DppEditorContentMinimalProps) {
  const { showNotification } = useNotification()
  const [dpp, setDpp] = useState<DppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit-State (Phase 2.1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [sku, setSku] = useState("")
  const [gtin, setGtin] = useState("")
  const [brand, setBrand] = useState("")
  const [countryOfOrigin, setCountryOfOrigin] = useState("")
  const [saving, setSaving] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<Array<{ value: string; label: string }>>([])

  // Lade verfügbare Kategorien beim Mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/app/categories")
        if (response.ok) {
          const data = await response.json()
          const categoryOptions = (data.categories || []).map((cat: { categoryKey: string; label: string }) => ({
            value: cat.categoryKey,
            label: cat.label
          }))
          setAvailableCategories(categoryOptions)
        }
      } catch (error) {
        console.error("[DppEditorContentMinimal] Error loading categories:", error)
      }
    }
    loadCategories()
  }, [])

  // Fetch DPP-Daten beim Mount
  useEffect(() => {
    async function loadDpp() {
      try {
        console.log("[DppEditorContentMinimal] START: Loading DPP with id:", id)
        
        const response = await fetch(`/api/app/dpp/${id}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        })
        
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            setError("Zugriff verweigert oder DPP nicht gefunden")
            setLoading(false)
            return
          }
          const errorData = await response.json()
          setError(errorData.error || "Fehler beim Laden des Produktpasses")
          setLoading(false)
          return
        }
        
        const data = await response.json()
        console.log("[DppEditorContentMinimal] DPP loaded successfully:", data.dpp?.id, data.dpp?.name)
        
        if (!data.dpp) {
          setError("DPP-Daten nicht gefunden")
          setLoading(false)
          return
        }
        
        // Extrahiere nur die direkten DPP-Eigenschaften (Phase 1 - minimal)
        const dppData: DppData = {
          id: data.dpp.id,
          name: data.dpp.name || "",
          description: data.dpp.description || null,
          category: data.dpp.category || "",
          sku: data.dpp.sku || null,
          gtin: data.dpp.gtin || null,
          brand: data.dpp.brand || null,
          countryOfOrigin: data.dpp.countryOfOrigin || null,
          status: data.dpp.status || "DRAFT",
          createdAt: data.dpp.createdAt,
          updatedAt: data.dpp.updatedAt
        }
        
        console.log("[DppEditorContentMinimal] Setting dpp state:", dppData)
        setDpp(dppData)
        
        // Phase 2.1: Initialisiere Edit-State mit geladenen Daten
        console.log("[DppEditorContentMinimal] Initializing edit state with category:", dppData.category)
        setName(dppData.name)
        setDescription(dppData.description || "")
        setCategory(dppData.category || "")
        setSku(dppData.sku || "")
        setGtin(dppData.gtin || "")
        setBrand(dppData.brand || "")
        setCountryOfOrigin(dppData.countryOfOrigin || "")
        
        setLoading(false)
      } catch (error) {
        console.error("[DppEditorContentMinimal] Error loading DPP:", error)
        setError("Fehler beim Laden des Produktpasses")
        setLoading(false)
      }
    }
    
    if (id && id !== "undefined" && id !== "") {
      loadDpp()
    } else {
      setError("DPP-ID fehlt oder ist ungültig")
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <p style={{ color: "#7A7A7A" }}>Digitaler Produktpass wird geladen...</p>
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
          color: "#DC2626",
          fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
          marginBottom: "1rem"
        }}>
          {error}
        </p>
        <Link
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
        </Link>
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
        <Link
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
        </Link>
      </div>
    )
  }

  // Phase 2.1: Save-Funktion
  const handleSave = async () => {
    if (!dpp) return
    
    // Trim-Werte für Validierung
    const trimmedName = name.trim()
    const trimmedCategory = category.trim()
    const trimmedSku = sku.trim()
    const trimmedBrand = brand.trim()
    const trimmedCountryOfOrigin = countryOfOrigin.trim()
    
    console.log("[DppEditorContentMinimal] Validating save - category:", category, "trimmed:", trimmedCategory)
    
    // Validierung: Pflichtfelder
    if (!trimmedName || trimmedName.length === 0) {
      showNotification("Produktname ist erforderlich", "error")
      return
    }
    
    if (!trimmedCategory || trimmedCategory.length === 0) {
      console.error("[DppEditorContentMinimal] Category validation failed - category is empty or whitespace")
      showNotification("Produktkategorie ist erforderlich", "error")
      return
    }
    
    // Validierung: Kategorie muss gültig sein
    const validCategories = ["TEXTILE", "FURNITURE", "OTHER"]
    if (!validCategories.includes(trimmedCategory)) {
      console.error("[DppEditorContentMinimal] Category validation failed - invalid category:", trimmedCategory, "valid categories:", validCategories)
      showNotification(`Produktkategorie muss einer der folgenden Werte sein: ${validCategories.join(", ")}`, "error")
      return
    }
    
    // Validierung: SKU ist Pflichtfeld
    if (!trimmedSku || trimmedSku.length === 0) {
      showNotification("SKU / Interne ID ist erforderlich", "error")
      return
    }
    
    // Validierung: Brand ist Pflichtfeld
    if (!trimmedBrand || trimmedBrand.length === 0) {
      showNotification("Marke / Hersteller ist erforderlich", "error")
      return
    }
    
    // Validierung: CountryOfOrigin ist Pflichtfeld
    if (!trimmedCountryOfOrigin || trimmedCountryOfOrigin.length === 0) {
      showNotification("Herstellungsland ist erforderlich", "error")
      return
    }
    
    setSaving(true)
    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || null,
        category: trimmedCategory,
        sku: trimmedSku,
        gtin: gtin.trim() || null,
        brand: trimmedBrand,
        countryOfOrigin: trimmedCountryOfOrigin
      }
      
      console.log("[DppEditorContentMinimal] Saving DPP with payload:", payload)
      
      const response = await fetch(`/api/app/dpp/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("[DppEditorContentMinimal] Save error:", errorData)
        showNotification(errorData.error || "Fehler beim Speichern", "error")
        setSaving(false)
        return
      }
      
      const data = await response.json()
      console.log("[DppEditorContentMinimal] DPP saved successfully:", data.dpp?.id)
      
      // Update local state
      setDpp(prev => prev ? {
        ...prev,
        name,
        description: description || null,
        category,
        sku: sku || null,
        gtin: gtin || null,
        brand: brand || null,
        countryOfOrigin: countryOfOrigin || null,
        updatedAt: new Date().toISOString()
      } : null)
      
      showNotification("Änderungen erfolgreich gespeichert", "success")
    } catch (error) {
      console.error("[DppEditorContentMinimal] Error saving DPP:", error)
      showNotification("Fehler beim Speichern", "error")
    } finally {
      setSaving(false)
    }
  }

  // Phase 2: Erweiterte Anzeige mit Edit-Funktionalität
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

      {/* Phase 1: Minimale Datenanzeige */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(2rem, 5vw, 4rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD"
      }}>
        <h1 style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "2rem"
        }}>
          Produktpass bearbeiten
        </h1>

        {/* Phase 2.1: Save-Button */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #CDCDCD"
        }}>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              backgroundColor: saving ? "#7A7A7A" : "#24c598",
              color: "#FFFFFF",
              padding: "clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
              borderRadius: "8px",
              border: "none",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              cursor: saving || loading ? "not-allowed" : "pointer",
              opacity: saving || loading ? 0.6 : 1,
              transition: "opacity 0.2s"
            }}
          >
            {saving ? "Speichern..." : "Änderungen speichern"}
          </button>
        </div>

        {/* Produktname */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Produktname *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Beschreibung */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box",
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
        </div>

        {/* Kategorie */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Produktkategorie *
          </label>
          {availableCategories.length > 0 ? (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "clamp(0.75rem, 2vw, 1rem)",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                color: "#0A0A0A",
                boxSizing: "border-box"
              }}
            >
              <option value="">Bitte wählen</option>
              {availableCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled
              style={{
                width: "100%",
                padding: "clamp(0.75rem, 2vw, 1rem)",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                backgroundColor: "#F5F5F5",
                color: "#7A7A7A",
                boxSizing: "border-box"
              }}
              placeholder="Kategorien werden geladen..."
            />
          )}
        </div>

        {/* SKU */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            SKU / Interne ID
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            style={{
              width: "100%",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* GTIN */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            GTIN / EAN
          </label>
          <input
            type="text"
            value={gtin}
            onChange={(e) => setGtin(e.target.value)}
            style={{
              width: "100%",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Marke */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Marke / Hersteller
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            style={{
              width: "100%",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Herstellungsland */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Herstellungsland
          </label>
          <input
            type="text"
            value={countryOfOrigin}
            onChange={(e) => setCountryOfOrigin(e.target.value)}
            style={{
              width: "100%",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Status */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Status
          </label>
          <input
            type="text"
            value={dpp.status}
            readOnly
            style={{
              width: "100%",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#F5F5F5",
              color: "#0A0A0A",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Debug-Info: DPP-Daten */}
        <div style={{
          backgroundColor: "#F5F5F5",
          padding: "1rem",
          borderRadius: "8px",
          marginTop: "2rem",
          fontSize: "0.85rem",
          color: "#7A7A7A"
        }}>
          <strong>Geladene DPP-Daten:</strong>
          <pre style={{
            marginTop: "0.5rem",
            padding: "0.5rem",
            backgroundColor: "#FFFFFF",
            border: "1px solid #CDCDCD",
            borderRadius: "4px",
            overflow: "auto",
            fontSize: "0.75rem"
          }}>
            {JSON.stringify(dpp, null, 2)}
          </pre>
        </div>
      </div>
    </>
  )
}

