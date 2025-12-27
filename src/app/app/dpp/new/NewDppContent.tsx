"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCategoriesWithLabels } from "@/lib/template-helpers"

interface CategoryInfo {
  label: string
  categoryKey: string
}

interface NewDppContentProps {
  availableCategories: Array<{ categoryKey: string; label: string }>
}

/**
 * Neue DPP erstellen (Client Component)
 * 
 * Formular zum Erstellen eines neuen DPPs
 */
export default function NewDppContent({ availableCategories }: NewDppContentProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>(availableCategories[0]?.categoryKey || "")
  const [organizationId, setOrganizationId] = useState("")
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [categoriesWithLabels, setCategoriesWithLabels] = useState<Map<string, CategoryInfo>>(new Map())
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Lade Organizations und Kategorie-Labels beim Mount
  useEffect(() => {
    async function loadData() {
      try {
        // Lade Organizations
        const orgResponse = await fetch("/api/app/organizations")
        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          setOrganizations(orgData.organizations || [])
          if (orgData.organizations && orgData.organizations.length > 0) {
            setOrganizationId(orgData.organizations[0].id)
          }
        }

        // Lade Kategorie-Labels
        const categoriesResponse = await fetch("/api/app/categories")
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          const labelsMap = new Map<string, CategoryInfo>()
          for (const cat of categoriesData.categories || []) {
            labelsMap.set(cat.categoryKey, cat)
          }
          setCategoriesWithLabels(labelsMap)
        }

        // Load prefilled data from preflight analysis (if available)
        try {
          const prefillDataStr = sessionStorage.getItem("preflightPrefillData")
          if (prefillDataStr) {
            const prefillData = JSON.parse(prefillDataStr)
            
            // Prefill category if available (check against availableCategories prop)
            if (prefillData.category && availableCategories.length > 0 && availableCategories.some(cat => cat.categoryKey === prefillData.category)) {
              setCategory(prefillData.category)
            }
            
            // Prefill name if available
            if (prefillData.name && typeof prefillData.name === "string" && prefillData.name.trim().length > 0) {
              setName(prefillData.name.trim())
            }
            
            // Clear sessionStorage after reading (one-time use)
            sessionStorage.removeItem("preflightPrefillData")
          }
        } catch (prefillError) {
          console.error("Error loading prefill data:", prefillError)
          // Clear invalid data
          sessionStorage.removeItem("preflightPrefillData")
        }
      } catch (err) {
        console.error("Error loading data:", err)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!name.trim()) {
      setError("Produktname ist erforderlich")
      return
    }

    if (!category) {
      setError("Produktkategorie ist erforderlich")
      return
    }

    if (availableCategories.length === 0) {
      setError("Keine Kategorien mit veröffentlichten Templates verfügbar. Bitte kontaktieren Sie einen Administrator.")
      return
    }

    if (!availableCategories.some(cat => cat.categoryKey === category)) {
      setError("Die ausgewählte Kategorie ist nicht verfügbar.")
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
          organizationId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fehler beim Erstellen des DPPs")
        setLoading(false)
        return
      }

      // Redirect to editor
      router.push(`/app/dpps/${data.dpp.id}`)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{
        fontSize: "2rem",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "2rem"
      }}>
        Neuen Produktpass erstellen
      </h1>

      {error && (
        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #E20074",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "2rem",
          color: "#E20074",
          fontSize: "0.95rem"
        }}>
          {error}
        </div>
      )}

      {availableCategories.length === 0 && (
        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #E20074",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "2rem",
          color: "#E20074",
          fontSize: "0.95rem"
        }}>
          Es sind keine Kategorien mit veröffentlichten Templates verfügbar. Bitte kontaktieren Sie einen Administrator.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="organization" style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Organisation *
          </label>
          <select
            id="organization"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.6875rem 2.5rem 0.6875rem clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box",
              minHeight: "42px",
              lineHeight: "1.5",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right clamp(0.75rem, 2vw, 1rem) center"
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
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading || availableCategories.length === 0}
            required
            style={{
              width: "100%",
              padding: "0.6875rem 2.5rem 0.6875rem clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box",
              minHeight: "42px",
              lineHeight: "1.5",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right clamp(0.75rem, 2vw, 1rem) center"
            }}
          >
            {availableCategories.length === 0 ? (
              <option value="">Keine Kategorien verfügbar</option>
            ) : (
              availableCategories.map((cat) => (
                <option key={cat.categoryKey} value={cat.categoryKey}>
                  {cat.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="name" style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Produktname *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.6875rem clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box",
              minHeight: "42px"
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="description" style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Beschreibung (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={4}
            style={{
              width: "100%",
              padding: "0.6875rem clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
        </div>

        <div style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "flex-end"
        }}>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#F5F5F5",
              color: "#0A0A0A",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || availableCategories.length === 0}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading || availableCategories.length === 0 ? "#CDCDCD" : "#E20074",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: loading || availableCategories.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Wird erstellt..." : "Erstellen"}
          </button>
        </div>
      </form>
    </div>
  )
}

