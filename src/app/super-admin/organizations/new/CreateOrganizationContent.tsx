"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateOrganizationContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    country: "",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
    licenseTier: "free",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/super-admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          legalName: formData.legalName,
          country: formData.country,
          adminEmail: formData.adminEmail,
          adminFirstName: formData.adminFirstName || undefined,
          adminLastName: formData.adminLastName || undefined,
          licenseTier: formData.licenseTier,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Erstellen der Organisation")
      }

      const data = await response.json()
      setSuccess("Organisation erfolgreich erstellt!")
      
      // Redirect to organization detail page after 2 seconds
      setTimeout(() => {
        router.push(`/super-admin/organizations/${data.organization.id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Erstellen der Organisation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      border: "1px solid #CDCDCD",
      borderRadius: "8px",
      padding: "2rem"
    }}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            padding: "1rem",
            backgroundColor: "#FEE",
            border: "1px solid #FCC",
            borderRadius: "6px",
            color: "#C33",
            marginBottom: "1.5rem"
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: "1rem",
            backgroundColor: "#E8F5E9",
            border: "1px solid #C8E6C9",
            borderRadius: "6px",
            color: "#2E7D32",
            marginBottom: "1.5rem"
          }}>
            {success}
          </div>
        )}

        <div style={{ display: "grid", gap: "1.5rem" }}>
          {/* Organization Name */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Organisationsname <span style={{ color: "#24c598" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box"
              }}
              placeholder="z.B. Acme GmbH"
            />
          </div>

          {/* Legal Name */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Rechtlicher Name <span style={{ color: "#24c598" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box"
              }}
              placeholder="z.B. Acme GmbH"
            />
          </div>

          {/* Country */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Land (ISO Code) <span style={{ color: "#24c598" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase().slice(0, 2) })}
              required
              maxLength={2}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box",
                textTransform: "uppercase"
              }}
              placeholder="DE"
            />
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A",
              marginTop: "0.25rem"
            }}>
              ISO 3166-1 alpha-2 Code (z.B. DE, AT, CH)
            </div>
          </div>

          {/* Admin Email */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Admin-E-Mail <span style={{ color: "#24c598" }}>*</span>
            </label>
            <input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box"
              }}
              placeholder="admin@example.com"
            />
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A",
              marginTop: "0.25rem"
            }}>
              Diese Person wird als ORG_ADMIN zugewiesen und erhält eine Einladungs-E-Mail.
            </div>
          </div>

          {/* Admin First Name */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Vorname (Admin)
            </label>
            <input
              type="text"
              value={formData.adminFirstName}
              onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box"
              }}
              placeholder="Max"
            />
          </div>

          {/* Admin Last Name */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Nachname (Admin)
            </label>
            <input
              type="text"
              value={formData.adminLastName}
              onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box"
              }}
              placeholder="Mustermann"
            />
          </div>

          {/* License Tier (Legacy, optional) */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              License Tier (Legacy)
            </label>
            <select
              value={formData.licenseTier}
              onChange={(e) => setFormData({ ...formData, licenseTier: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box"
              }}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
            </select>
            <div style={{
              fontSize: "0.75rem",
              color: "#7A7A7A",
              marginTop: "0.25rem"
            }}>
              Hinweis: Der tatsächliche Tarif wird über Subscriptions verwaltet.
            </div>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "1rem",
          marginTop: "2rem",
          justifyContent: "flex-end"
        }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "transparent",
              color: "#0A0A0A",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading ? "#CDCDCD" : "#24c598",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Wird erstellt..." : "Organisation erstellen"}
          </button>
        </div>
      </form>
    </div>
  )
}

