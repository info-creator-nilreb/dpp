"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import bcrypt from "bcryptjs"

interface Organization {
  id: string
  name: string
}

interface CreateUserContentProps {
  organizations: Organization[]
}

export default function CreateUserContent({ organizations }: CreateUserContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organizationId: "",
    role: "VIEWER",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.organizationId) {
      setError("Bitte füllen Sie alle Pflichtfelder aus")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push("/super-admin/users")
      } else {
        const data = await response.json()
        setError(data.error || "Fehler beim Erstellen des Benutzers")
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      maxWidth: "100%", 
      margin: "0 auto", 
      padding: "clamp(1rem, 2vw, 2rem)",
      boxSizing: "border-box",
      width: "100%",
      overflowX: "hidden"
    }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/super-admin/users"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "0.9rem",
            marginBottom: "0.5rem",
            display: "block"
          }}
        >
          ← Zurück zu Benutzer
        </Link>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#0A0A0A"
        }}>
          Neuer Benutzer
        </h1>
      </div>

      {error && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEE2E2",
          border: "1px solid #FCA5A5",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#991B1B"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "2rem"
      }}>
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Vorname <span style={{ color: "#E20074" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Nachname <span style={{ color: "#E20074" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              E-Mail <span style={{ color: "#E20074" }}>*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Organisation <span style={{ color: "#E20074" }}>*</span>
            </label>
            <select
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            >
              <option value="">Bitte wählen</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Rolle <span style={{ color: "#E20074" }}>*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            >
              <option value="VIEWER">Betrachter</option>
              <option value="EDITOR">Editor</option>
              <option value="ORG_ADMIN">Organisations-Administrator</option>
            </select>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "1rem",
          marginTop: "2rem"
        }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading ? "#7A7A7A" : "#E20074",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Erstelle..." : "Benutzer erstellen"}
          </button>
          <Link
            href="/super-admin/users"
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "transparent",
              color: "#0A0A0A",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-block"
            }}
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}

