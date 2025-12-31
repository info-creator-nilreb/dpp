"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/**
 * Persönliche Daten (My Profile)
 * 
 * Phase 1: User scope only - Name, E-Mail, Role, Organization (read-only link)
 * Organization management is moved to /app/organization
 */
export function PersonalDataPageContent() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Load user data and role
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [userResponse, profileResponse] = await Promise.all([
          fetch("/api/app/account", { cache: "no-store" }),
          fetch("/api/app/profile", { cache: "no-store" })
        ])

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserName(userData.name || "")
          setUserEmail(userData.email || "")
        }

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.user) {
            setUserRole(profileData.user.role || null)
            if (profileData.user.organization) {
              setOrganizationName(profileData.user.organization.name)
              setOrganizationId(profileData.user.organization.id)
            }
          }
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Fehler beim Laden der Daten")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleSave() {
    if (!userName.trim()) {
      setError("Bitte geben Sie einen Namen ein.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Update User (only user name, organization is managed separately)
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
        throw new Error(errorData.error || "Fehler beim Aktualisieren des Benutzers")
      }

      // Success: Exit edit mode and refresh
      setIsEditing(false)
      setSuccess("Ihre Daten wurden erfolgreich gespeichert")
      router.refresh()
      
      // Remove success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
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
          href="/app/account"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zurück zu Meine Daten
        </Link>
      </div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Mein Profil
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Verwalten Sie Ihre persönlichen Informationen. Organisationsdaten können Sie im Bereich Organisation verwalten.
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

      {success && (
        <div style={{
          backgroundColor: "#D1FAE5",
          border: "1px solid #86EFAC",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
          color: "#065F46"
        }}>
          {success}
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

          {/* Role (read-only) */}
          {userRole && (
            <div>
              <label style={{
                display: "block",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Rolle
              </label>
              <p style={{
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                color: "#0A0A0A",
                padding: "clamp(0.75rem, 2vw, 1rem)",
                backgroundColor: "#F5F5F5",
                borderRadius: "8px",
                margin: 0,
                fontWeight: "500"
              }}>
                {userRole === "ORG_ADMIN" ? "Organisations-Administrator" : 
                 userRole === "EDITOR" ? "Editor" : 
                 userRole === "VIEWER" ? "Betrachter" : userRole}
              </p>
            </div>
          )}

          {/* Organization (read-only, only show name) */}
          {organizationId && (
            <div>
              <label style={{
                display: "block",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Organisation
              </label>
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
            </div>
          )}
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
                  setSuccess("")
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

