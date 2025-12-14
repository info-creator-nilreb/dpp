"use client"

export const dynamic = "force-dynamic"

import { headers } from "next/headers"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Neue DPP erstellen
 * 
 * Formular zum Erstellen eines neuen DPPs
 */
export default function NewDppPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<"TEXTILE" | "FURNITURE" | "OTHER">("OTHER")
  const [organizationId, setOrganizationId] = useState("")
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Lade Organizations beim Mount
  useEffect(() => {
    async function loadOrganizations() {
      try {
        // Hole Organizations über API (da getUserOrganizations Server-Funktion ist)
        const response = await fetch("/api/app/organizations")
        if (response.ok) {
          const data = await response.json()
          setOrganizations(data.organizations || [])
          if (data.organizations && data.organizations.length > 0) {
            setOrganizationId(data.organizations[0].id)
          }
        }
      } catch (err) {
        console.error("Error loading organizations:", err)
      }
    }
    loadOrganizations()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!name.trim()) {
      setError("Produktname ist erforderlich")
      return
    }

    if (!category) {
      setError("Bitte wählen Sie eine Produktkategorie")
      return
    }

    if (!organizationId) {
      setError("Bitte wählen Sie eine Organisation")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/app/dpp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          sku: "", // Wird im Editor ausgefüllt
          brand: "", // Wird im Editor ausgefüllt
          countryOfOrigin: "", // Wird im Editor ausgefüllt
          organizationId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten")
        setLoading(false)
      } else {
        // Erfolgreich erstellt → Weiterleitung zum Editor
        router.push(`/app/dpp/${data.dpp.id}`)
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Neuer DPP
      </h1>

      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        maxWidth: "600px"
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="organization" style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Organisation
            </label>
            <select
              id="organization"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              disabled={loading || organizations.length === 0}
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
              {organizations.length === 0 ? (
                <option value="">Keine Organisation verfügbar</option>
              ) : (
                organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="dpp-category" style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Produktkategorie *
            </label>
            <select
              id="dpp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as "TEXTILE" | "FURNITURE" | "OTHER")}
              disabled={loading}
              required
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
              <option value="TEXTILE">Textil</option>
              <option value="FURNITURE">Möbel</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="dpp-name" style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Produktname *
            </label>
            <input
              id="dpp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              style={{
                width: "100%",
                padding: "clamp(0.75rem, 2vw, 1rem)",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                border: error ? "2px solid #E20074" : "1px solid #CDCDCD",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                color: "#0A0A0A",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="dpp-description" style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Beschreibung
            </label>
            <textarea
              id="dpp-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
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

          {error && (
            <div style={{
              padding: "0.75rem",
              backgroundColor: "#FFF5F5",
              border: "1px solid #E20074",
              borderRadius: "6px",
              color: "#E20074",
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              marginBottom: "1rem"
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={loading || !name.trim() || !category || !organizationId}
              style={{
                padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.25rem, 4vw, 2rem)",
                backgroundColor: loading || !name.trim() || !category || !organizationId ? "#CDCDCD" : "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                fontWeight: "600",
                cursor: loading || !name.trim() || !organizationId ? "not-allowed" : "pointer",
                boxShadow: loading || !name.trim() || !organizationId ? "none" : "0 4px 12px rgba(226, 0, 116, 0.3)"
              }}
            >
              {loading ? "Wird erstellt..." : "DPP erstellen"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              style={{
                padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.25rem, 4vw, 2rem)",
                backgroundColor: "transparent",
                color: "#0A0A0A",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

