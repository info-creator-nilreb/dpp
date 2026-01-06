"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Onboarding-Seite
 * 
 * Ermöglicht es dem User, den Namen seiner Organisation festzulegen.
 * Erscheint nur einmal, wenn die Organisation einen Platzhalter-Namen hat.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validierung
    if (!organizationName.trim()) {
      setError("Bitte geben Sie einen Namen für Ihre Organisation ein")
      return
    }

    if (organizationName.trim().length < 2) {
      setError("Der Name muss mindestens 2 Zeichen lang sein")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/app/organization/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: organizationName.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten")
        setLoading(false)
      } else {
        // Erfolgreich gespeichert → Weiterleitung zum Dashboard mit Refresh
        router.replace("/app/dashboard")
        router.refresh() // Revalidiere Server Components, damit Organisation überall konsistent ist
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: "100%",
      maxWidth: "600px",
      margin: "0 auto",
      padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)"
    }}>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        Willkommen bei Easy Pass
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Geben Sie Ihrer Organisation einen Namen, um zu beginnen.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="organizationName" style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Name Ihrer Organisation
          </label>
          <input
            id="organizationName"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="z.B. Meine Firma GmbH"
            disabled={loading}
            style={{
              width: "100%",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: error ? "2px solid #24c598" : "1px solid #CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box"
            }}
            autoFocus
          />
          {error && (
            <p style={{
              color: "#24c598",
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              marginTop: "0.5rem"
            }}>
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !organizationName.trim()}
          style={{
            width: "100%",
            padding: "clamp(0.875rem, 2.5vw, 1rem)",
            backgroundColor: loading || !organizationName.trim() ? "#CDCDCD" : "#24c598",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            cursor: loading || !organizationName.trim() ? "not-allowed" : "pointer",
            boxShadow: loading || !organizationName.trim() ? "none" : "0 4px 12px rgba(226, 0, 116, 0.3)"
          }}
        >
          {loading ? "Wird gespeichert..." : "Speichern & weiter"}
        </button>
      </form>
    </div>
  )
}

