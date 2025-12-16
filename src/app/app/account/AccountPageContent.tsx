"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/**
 * Meine Daten
 * 
 * Account-Verwaltung (editierbar)
 */
export function AccountPageContent() {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Lade Daten beim Mount
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [orgResponse, userResponse] = await Promise.all([
          fetch("/api/app/organizations", { cache: "no-store" }),
          fetch("/api/app/account", { cache: "no-store" })
        ])

        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          if (orgData.organizations && orgData.organizations.length > 0) {
            const org = orgData.organizations[0]
            setOrganizationName(org.name)
            setOrganizationId(org.id)
          }
        }

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserName(userData.name || "")
          setUserEmail(userData.email || "")
        }
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleSave() {
    if (!organizationName.trim() || !userName.trim()) {
      setError("Bitte füllen Sie alle Pflichtfelder aus.")
      return
    }

    setSaving(true)
    setError("")

    try {
      // Update Organization
      const orgResponse = await fetch("/api/app/organizations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: organizationName.trim()
        })
      })

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren der Organization")
      }

      // Update User
      const userResponse = await fetch("/api/app/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: userName.trim()
        })
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren des Users")
      }

      // Erfolg: Bearbeitungsmodus verlassen und State aktualisieren
      setIsEditing(false)
      router.refresh() // Revalidiere Server Components, damit Organisation überall konsistent ist
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.")
      console.error("Error saving data:", err)
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <div>
      <div style={{
        marginBottom: "1rem"
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
      </div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Meine Daten
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Verwalten Sie Ihre Kontoinformationen und Einstellungen.
      </p>

      {error && (
        <div style={{
          backgroundColor: "#FEE2E2",
          border: "1px solid #FCA5A5",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
          color: "#991B1B"
        }}>
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        padding: "clamp(1.5rem, 4vw, 2rem)"
      }}>
        <div style={{
          display: "grid",
          gap: "1.5rem"
        }}>
          {/* Organization Name */}
          <div>
            <label style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Organisationsname <span style={{ color: "#E20074" }}>*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Organisationsname"
                style={{
                  width: "100%",
                  padding: "clamp(0.75rem, 2vw, 1rem)",
                  fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  color: "#0A0A0A",
                  backgroundColor: "#FFFFFF"
                }}
              />
            ) : (
              <p style={{
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                color: "#0A0A0A",
                padding: "clamp(0.75rem, 2vw, 1rem)",
                backgroundColor: "#F5F5F5",
                borderRadius: "8px",
                margin: 0
              }}>
                {organizationName || "Nicht gesetzt"}
              </p>
            )}
          </div>

          {/* User Name */}
          <div>
            <label style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Name <span style={{ color: "#E20074" }}>*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ihr Name"
                style={{
                  width: "100%",
                  padding: "clamp(0.75rem, 2vw, 1rem)",
                  fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  color: "#0A0A0A",
                  backgroundColor: "#FFFFFF"
                }}
              />
            ) : (
              <p style={{
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                color: "#0A0A0A",
                padding: "clamp(0.75rem, 2vw, 1rem)",
                backgroundColor: "#F5F5F5",
                borderRadius: "8px",
                margin: 0
              }}>
                {userName || "Nicht gesetzt"}
              </p>
            )}
          </div>

          {/* User Email (read-only) */}
          <div>
            <label style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              E-Mail
            </label>
            <p style={{
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              color: "#7A7A7A",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              backgroundColor: "#F5F5F5",
              borderRadius: "8px",
              margin: 0
            }}>
              {userEmail}
            </p>
            <p style={{
              fontSize: "clamp(0.8rem, 1.5vw, 0.85rem)",
              color: "#7A7A7A",
              marginTop: "0.5rem",
              margin: "0.5rem 0 0 0"
            }}>
              Die E-Mail-Adresse kann nicht geändert werden.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "1rem",
          marginTop: "2rem",
          flexWrap: "wrap"
        }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: saving ? "#7A7A7A" : "#E20074",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  borderRadius: "8px",
                  fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                  fontWeight: "600",
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: saving ? "none" : "0 4px 12px rgba(226, 0, 116, 0.3)"
                }}
              >
                {saving ? "Speichern..." : "Speichern"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setError("")
                  // Reload data to reset changes
                  window.location.reload()
                }}
                disabled={saving}
                style={{
                  backgroundColor: "transparent",
                  color: "#0A0A0A",
                  border: "1px solid #CDCDCD",
                  padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  borderRadius: "8px",
                  fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                  fontWeight: "600",
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                Abbrechen
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                backgroundColor: "#E20074",
                color: "#FFFFFF",
                border: "none",
                padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                borderRadius: "8px",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
              }}
            >
              Bearbeiten
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

