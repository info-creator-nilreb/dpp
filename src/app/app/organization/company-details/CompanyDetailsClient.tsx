"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface CompanyDetails {
  legalName: string | null
  companyType: string | null
  vatId: string | null
  commercialRegisterId: string | null
  addressStreet: string | null
  addressZip: string | null
  addressCity: string | null
  addressCountry: string | null
  country: string | null
}

export default function CompanyDetailsClient() {
  const [details, setDetails] = useState<CompanyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form fields
  const [legalName, setLegalName] = useState("")
  const [companyType, setCompanyType] = useState("")
  const [vatId, setVatId] = useState("")
  const [commercialRegisterId, setCommercialRegisterId] = useState("")
  const [addressStreet, setAddressStreet] = useState("")
  const [addressZip, setAddressZip] = useState("")
  const [addressCity, setAddressCity] = useState("")
  const [addressCountry, setAddressCountry] = useState("")
  const [country, setCountry] = useState("")

  useEffect(() => {
    loadDetails()
  }, [])

  async function loadDetails() {
    setLoading(true)
    try {
      const response = await fetch("/api/app/organization/company-details", {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        const companyDetails = data.companyDetails
        setDetails(companyDetails)
        setLegalName(companyDetails.legalName || "")
        setCompanyType(companyDetails.companyType || "")
        setVatId(companyDetails.vatId || "")
        setCommercialRegisterId(companyDetails.commercialRegisterId || "")
        setAddressStreet(companyDetails.addressStreet || "")
        setAddressZip(companyDetails.addressZip || "")
        setAddressCity(companyDetails.addressCity || "")
        setAddressCountry(companyDetails.addressCountry || "")
        setCountry(companyDetails.country || "")
      }
    } catch (err) {
      console.error("Error loading company details:", err)
      setError("Fehler beim Laden der Firmendaten")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/app/organization/company-details", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          legalName: legalName.trim() || null,
          companyType: companyType.trim() || null,
          vatId: vatId.trim() || null,
          commercialRegisterId: commercialRegisterId.trim() || null,
          addressStreet: addressStreet.trim() || null,
          addressZip: addressZip.trim() || null,
          addressCity: addressCity.trim() || null,
          addressCountry: addressCountry.trim() || null,
          country: country.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren der Firmendaten")
      }

      setSuccess("Firmendaten erfolgreich aktualisiert")
      await loadDetails()
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Aktualisieren der Firmendaten")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Firmendaten werden geladen..." />
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
        Firmendaten
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
          Rechtliche Informationen
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
              Rechtlicher Name
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="z.B. Beispiel GmbH"
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
              Rechtsform
            </label>
            <input
              type="text"
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value)}
              placeholder="z.B. GmbH, AG, UG"
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
              USt-IdNr. / VAT ID
            </label>
            <input
              type="text"
              value={vatId}
              onChange={(e) => setVatId(e.target.value)}
              placeholder="z.B. DE123456789"
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
              Handelsregisternummer
            </label>
            <input
              type="text"
              value={commercialRegisterId}
              onChange={(e) => setCommercialRegisterId(e.target.value)}
              placeholder="z.B. HRB 12345"
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

        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1.5rem",
          marginTop: "2rem",
        }}>
          Adresse
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
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
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
              value={addressZip}
              onChange={(e) => setAddressZip(e.target.value)}
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
              value={addressCity}
              onChange={(e) => setAddressCity(e.target.value)}
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
              value={addressCountry}
              onChange={(e) => setAddressCountry(e.target.value)}
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
              ISO-Ländercode
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
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

