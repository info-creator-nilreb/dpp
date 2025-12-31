"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface BillingInfo {
  billingEmail: string | null
  billingContactUserId: string | null
  invoiceAddressStreet: string | null
  invoiceAddressZip: string | null
  invoiceAddressCity: string | null
  invoiceAddressCountry: string | null
  billingCountry: string | null
}

interface Subscription {
  status: string
  currentPeriodEnd: string | null
}

export default function BillingClient() {
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form fields
  const [billingEmail, setBillingEmail] = useState("")
  const [billingContactUserId, setBillingContactUserId] = useState("")
  const [invoiceAddressStreet, setInvoiceAddressStreet] = useState("")
  const [invoiceAddressZip, setInvoiceAddressZip] = useState("")
  const [invoiceAddressCity, setInvoiceAddressCity] = useState("")
  const [invoiceAddressCountry, setInvoiceAddressCountry] = useState("")
  const [billingCountry, setBillingCountry] = useState("")

  useEffect(() => {
    loadBilling()
    loadUsers()
  }, [])

  async function loadBilling() {
    setLoading(true)
    try {
      const response = await fetch("/api/app/organization/billing", {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        setBilling(data.billing)
        setSubscription(data.subscription)
        setBillingEmail(data.billing.billingEmail || "")
        setBillingContactUserId(data.billing.billingContactUserId || "")
        setInvoiceAddressStreet(data.billing.invoiceAddressStreet || "")
        setInvoiceAddressZip(data.billing.invoiceAddressZip || "")
        setInvoiceAddressCity(data.billing.invoiceAddressCity || "")
        setInvoiceAddressCountry(data.billing.invoiceAddressCountry || "")
        setBillingCountry(data.billing.billingCountry || "")
      }
    } catch (err) {
      console.error("Error loading billing info:", err)
      setError("Fehler beim Laden der Rechnungsinformationen")
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch("/api/app/organization/users", {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error("Error loading users:", err)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/app/organization/billing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingEmail: billingEmail.trim() || null,
          billingContactUserId: billingContactUserId.trim() || null,
          invoiceAddressStreet: invoiceAddressStreet.trim() || null,
          invoiceAddressZip: invoiceAddressZip.trim() || null,
          invoiceAddressCity: invoiceAddressCity.trim() || null,
          invoiceAddressCountry: invoiceAddressCountry.trim() || null,
          billingCountry: billingCountry.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren der Rechnungsinformationen")
      }

      setSuccess("Rechnungsinformationen erfolgreich aktualisiert")
      await loadBilling()
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Aktualisieren der Rechnungsinformationen")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Rechnungsinformationen werden geladen..." />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/organization"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
          }}
        >
          ← Zur Organisation
        </Link>
      </div>

      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem",
      }}>
        Rechnungsinformationen
      </h1>

      {error && (
        <div style={{
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#FEE",
          border: "1px solid #FCC",
          borderRadius: "6px",
          color: "#C33",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#E8F5E9",
          border: "1px solid #C8E6C9",
          borderRadius: "6px",
          color: "#2E7D32",
          fontSize: "0.9rem",
        }}>
          {success}
        </div>
      )}

      {subscription && (
        <div style={{
          padding: "1rem",
          marginBottom: "2rem",
          backgroundColor: "#F5F5F5",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
        }}>
          <h3 style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem",
          }}>
            Abonnement-Status
          </h3>
          <p style={{ color: "#7A7A7A", fontSize: "0.9rem", margin: 0 }}>
            Status: <strong>{subscription.status}</strong>
            {subscription.currentPeriodEnd && (
              <> • Läuft ab: {new Date(subscription.currentPeriodEnd).toLocaleDateString("de-DE")}</>
            )}
          </p>
        </div>
      )}

      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "12px",
        padding: "2rem",
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1.5rem",
        }}>
          Rechnungs-Kontakt
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Rechnungs-E-Mail
            </label>
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@example.com"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Rechnungs-Kontakt (User)
            </label>
            <select
              value={billingContactUserId}
              onChange={(e) => setBillingContactUserId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            >
              <option value="">Keine Auswahl</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1.5rem",
          marginTop: "2rem",
        }}>
          Rechnungsadresse
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Straße und Hausnummer
            </label>
            <input
              type="text"
              value={invoiceAddressStreet}
              onChange={(e) => setInvoiceAddressStreet(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Postleitzahl
            </label>
            <input
              type="text"
              value={invoiceAddressZip}
              onChange={(e) => setInvoiceAddressZip(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Stadt
            </label>
            <input
              type="text"
              value={invoiceAddressCity}
              onChange={(e) => setInvoiceAddressCity(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Land
            </label>
            <input
              type="text"
              value={invoiceAddressCountry}
              onChange={(e) => setInvoiceAddressCountry(e.target.value)}
              placeholder="z.B. Deutschland"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              ISO-Ländercode (für Steuern)
            </label>
            <input
              type="text"
              value={billingCountry}
              onChange={(e) => setBillingCountry(e.target.value)}
              placeholder="z.B. DE"
              maxLength={2}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: saving ? "#CDCDCD" : "#E20074",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  )
}

