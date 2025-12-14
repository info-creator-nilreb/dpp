"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/**
 * Meine Daten
 * 
 * Account-Verwaltung (editierbar)
 */
export default function AccountPage() {
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
          fetch("/api/app/organizations"),
          fetch("/api/app/account")
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

  const handleSave = async () => {
    setError("")
    setSaving(true)

    try {
      // Speichere Organisationsname
      if (organizationId) {
        const orgResponse = await fetch("/api/app/organization/update-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: organizationName.trim() })
        })

        if (!orgResponse.ok) {
          const data = await orgResponse.json()
          setError(data.error || "Fehler beim Speichern des Organisationsnamens")
          setSaving(false)
          return
        }
      }

      // Speichere Benutzername
      const userResponse = await fetch("/api/app/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName.trim() })
      })

      if (!userResponse.ok) {
        const data = await userResponse.json()
        setError(data.error || "Fehler beim Speichern des Benutzernamens")
        setSaving(false)
        return
      }

      // Erfolgreich gespeichert
      setIsEditing(false)
      setSaving(false)
      router.refresh()
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <p style={{ color: "#7A7A7A" }}>Lädt...</p>
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
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          margin: 0
        }}>
          Meine Daten
        </h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.25rem)",
              backgroundColor: "#E20074",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
            }}
          >
            Bearbeiten
          </button>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.25rem)",
                backgroundColor: saving ? "#CDCDCD" : "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 12px rgba(226, 0, 116, 0.3)"
              }}
            >
              {saving ? "Wird gespeichert..." : "Speichern"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setError("")
                router.refresh()
              }}
              disabled={saving}
              style={{
                padding: "clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.25rem)",
                backgroundColor: "transparent",
                color: "#0A0A0A",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                cursor: saving ? "not-allowed" : "pointer"
              }}
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Verwalten Sie Ihre Kontoinformationen und Einstellungen.
      </p>

      {error && (
        <div style={{
          padding: "0.75rem",
          backgroundColor: "#FFF5F5",
          border: "1px solid #E20074",
          borderRadius: "6px",
          color: "#E20074",
          fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
          marginBottom: "1.5rem"
        }}>
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD"
      }}>
        <h2 style={{
          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1.5rem"
        }}>
          Kontoinformationen
        </h2>

        {organizationId && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="organization-name" style={{
              display: "block",
              color: "#7A7A7A",
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              marginBottom: "0.5rem",
              fontWeight: "600"
            }}>
              Organisation
            </label>
            {isEditing ? (
              <input
                id="organization-name"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                disabled={saving}
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
            ) : (
              <div style={{
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                fontWeight: "500",
                color: "#0A0A0A",
                padding: "0.75rem",
                backgroundColor: "#F5F5F5",
                borderRadius: "6px"
              }}>
                {organizationName}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="user-name" style={{
            display: "block",
            color: "#7A7A7A",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            marginBottom: "0.5rem",
            fontWeight: "600"
          }}>
            Name
          </label>
          {isEditing ? (
            <input
              id="user-name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={saving}
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
          ) : (
            <div style={{
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "500",
              color: "#0A0A0A",
              padding: "0.75rem",
              backgroundColor: "#F5F5F5",
              borderRadius: "6px"
            }}>
              {userName || "Nicht angegeben"}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            color: "#7A7A7A",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            marginBottom: "0.5rem",
            fontWeight: "600"
          }}>
            E-Mail
          </label>
          <div style={{
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "500",
            color: "#0A0A0A",
            padding: "0.75rem",
            backgroundColor: "#F5F5F5",
            borderRadius: "6px"
          }}>
            {userEmail}
          </div>
          <p style={{
            fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            color: "#7A7A7A",
            marginTop: "0.5rem"
          }}>
            E-Mail-Adresse kann nicht geändert werden.
          </p>
        </div>
      </div>
    </div>
  )
}
