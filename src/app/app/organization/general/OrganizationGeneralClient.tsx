"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface Organization {
  id: string
  name: string
  status: string
  createdAt: string
  role?: string
  canEdit?: boolean
}

export default function OrganizationGeneralClient() {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [organizationName, setOrganizationName] = useState("")

  useEffect(() => {
    async function loadOrganization() {
      setLoading(true)
      try {
        const response = await fetch("/api/app/organization/general", {
          cache: "no-store"
        })
        
        if (response.ok) {
          const data = await response.json()
          setOrganization(data.organization)
          setOrganizationName(data.organization.name)
        } else {
          const errorData = await response.json()
          setError(errorData.error || "Fehler beim Laden der Organisationsdaten")
        }
      } catch (err) {
        console.error("Error loading organization:", err)
        setError("Fehler beim Laden der Organisationsdaten")
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()
  }, [])

  async function handleSave() {
    if (!organizationName.trim()) {
      setError("Bitte geben Sie einen Organisationsnamen ein.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/app/organization/general", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: organizationName.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren der Organisation")
      }

      const data = await response.json()
      setOrganization(data.organization)
      setIsEditing(false)
      setSuccess("Organisationsdaten wurden erfolgreich gespeichert")
      router.refresh()
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.")
      console.error("Error saving organization:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Lade Organisationsdaten..." />
      </div>
    )
  }

  if (!organization) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "#DC2626" }}>Organisation nicht gefunden</p>
        <Link
          href="/app/organization"
          style={{
            color: "#24c598",
            textDecoration: "none",
            fontWeight: "500"
          }}
        >
          ← Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  const canEdit = organization.canEdit === true

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/organization"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zurück zur Organisation
        </Link>
      </div>
      
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Allgemeine Einstellungen
      </h1>
      
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Verwalten Sie grundlegende Informationen Ihrer Organisation.
      </p>

      {!canEdit && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEF3C7",
          border: "1px solid #FCD34D",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#92400E"
        }}>
          Sie haben nur Leseberechtigung. Nur Organisations-Administratoren können Änderungen vornehmen.
        </div>
      )}

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
          {/* Organization Name */}
          <div>
            <label style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Organisationsname <span style={{ color: "#24c598" }}>*</span>
            </label>
            {isEditing && canEdit ? (
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
                margin: 0,
                fontWeight: "500"
              }}>
                {organization.name || "Nicht gesetzt"}
              </p>
            )}
          </div>

          {/* Status (read-only) */}
          <div>
            <label style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Status
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
              {organization.status === "active" ? "Aktiv" : organization.status}
            </p>
          </div>

          {/* Creation Date (read-only) */}
          <div>
            <label style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Erstellt am
            </label>
            <p style={{
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              color: "#0A0A0A",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              backgroundColor: "#F5F5F5",
              borderRadius: "8px",
              margin: 0
            }}>
              {new Date(organization.createdAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
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
                    backgroundColor: saving ? "#7A7A7A" : "#24c598",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                    borderRadius: "8px",
                    fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                    fontWeight: "600",
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: saving ? "none" : "0 4px 12px rgba(36, 197, 152, 0.3)"
                  }}
                >
                  {saving ? "Speichern..." : "Speichern"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setOrganizationName(organization.name)
                    setError("")
                    setSuccess("")
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
                  backgroundColor: "#24c598",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  borderRadius: "8px",
                  fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(36, 197, 152, 0.3)"
                }}
              >
                Bearbeiten
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

