"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import CountrySelect from "@/components/CountrySelect"
import VatIdInput from "@/components/VatIdInput"

interface OrganizationBasic {
  name: string
  status: string
  createdAt: string
  canEdit: boolean
}

interface CompanyDetails {
  legalName: string | null
  companyType: string | null
  vatId: string | null
  eori: string | null
  commercialRegisterId: string | null
  registrationCountry: string | null
  addressStreet: string | null
  addressZip: string | null
  addressCity: string | null
  addressCountry: string | null
  country: string | null
}

export default function CompanyDetailsClient() {
  const [organization, setOrganization] = useState<OrganizationBasic | null>(null)
  const [details, setDetails] = useState<CompanyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form fields – Grunddaten (ehem. Allgemeine Einstellungen)
  const [organizationName, setOrganizationName] = useState("")
  // Form fields – Firmendaten
  const [legalName, setLegalName] = useState("")
  const [companyType, setCompanyType] = useState("")
  const [vatId, setVatId] = useState("")
  const [eori, setEori] = useState("")
  const [commercialRegisterId, setCommercialRegisterId] = useState("")
  const [registrationCountry, setRegistrationCountry] = useState("")
  const [registrationDiffersFromAddress, setRegistrationDiffersFromAddress] = useState(false)
  const [addressStreet, setAddressStreet] = useState("")
  const [addressZip, setAddressZip] = useState("")
  const [addressCity, setAddressCity] = useState("")
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
        if (data.organization) {
          setOrganization(data.organization)
          setOrganizationName(data.organization.name || "")
        }
        const companyDetails = data.companyDetails
        setDetails(companyDetails)
        setLegalName(companyDetails?.legalName || "")
        setCompanyType(companyDetails?.companyType || "")
        setVatId(companyDetails?.vatId || "")
        setEori(companyDetails?.eori || "")
        setCommercialRegisterId(companyDetails?.commercialRegisterId || "")
        setRegistrationCountry(companyDetails?.registrationCountry || "")
        const regC = companyDetails?.registrationCountry?.trim() || ""
        const addrC = (companyDetails?.country ?? "").trim()
        setRegistrationDiffersFromAddress(!!(regC && addrC && regC !== addrC))
        setAddressStreet(companyDetails?.addressStreet || "")
        setAddressZip(companyDetails?.addressZip || "")
        setAddressCity(companyDetails?.addressCity || "")
        setCountry(companyDetails?.country || "")
      }
    } catch (err) {
      console.error("Error loading company details:", err)
      setError("Fehler beim Laden der Firmendaten")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (organization?.canEdit && !organizationName.trim()) {
      setError("Bitte geben Sie einen Organisationsnamen ein.")
      return
    }
    const countryVal = country.trim()
    if (!countryVal) {
      setError("Bitte wählen Sie das Land der Geschäftsadresse.")
      return
    }
    if (registrationDiffersFromAddress && !registrationCountry.trim()) {
      setError("Bitte wählen Sie das Land der Registrierung (rechtlicher Sitz).")
      return
    }
    const registrationCountryVal = registrationDiffersFromAddress ? registrationCountry.trim() : countryVal
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
          name: organizationName.trim() || undefined,
          legalName: legalName.trim() || null,
          companyType: companyType.trim() || null,
          vatId: vatId.trim() || null,
          eori: eori.trim() || null,
          commercialRegisterId: commercialRegisterId.trim() || null,
          registrationCountry: registrationCountryVal || null,
          addressStreet: addressStreet.trim() || null,
          addressZip: addressZip.trim() || null,
          addressCity: addressCity.trim() || null,
          country: countryVal || null,
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

      {organization && !organization.canEdit && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEF3C7",
          border: "1px solid #FCD34D",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#92400E",
        }}>
          Sie haben nur Leseberechtigung. Nur Organisations-Administratoren können Änderungen vornehmen.
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
          Grunddaten
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
              Organisationsname <span style={{ color: "#24c598" }}>*</span>
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Organisationsname"
              readOnly={!organization?.canEdit}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
                backgroundColor: organization?.canEdit ? "#FFFFFF" : "#F5F5F5",
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
              Status
            </label>
            <p style={{
              margin: 0,
              padding: "0.75rem",
              backgroundColor: "#F5F5F5",
              borderRadius: "6px",
              fontSize: "1rem",
              color: "#0A0A0A",
            }}>
              {organization?.status === "active" ? "Aktiv" : organization?.status}
            </p>
          </div>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Erstellt am
            </label>
            <p style={{
              margin: 0,
              padding: "0.75rem",
              backgroundColor: "#F5F5F5",
              borderRadius: "6px",
              fontSize: "1rem",
              color: "#0A0A0A",
            }}>
              {organization?.createdAt
                ? new Date(organization.createdAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
        </div>

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
            <VatIdInput
              id="vatId"
              label="USt-IdNr. / VAT ID (EU)"
              value={vatId}
              onChange={setVatId}
              placeholder="z.B. DE123456789"
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
              EORI-Nummer
            </label>
            <input
              type="text"
              value={eori}
              onChange={(e) => setEori(e.target.value)}
              placeholder="z.B. DE1234567890123"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#6B7280" }}>
              Erforderlich bei Import/Export von Waren in die bzw. aus der EU.
            </p>
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
            <CountrySelect
              id="country"
              label="Land (Geschäftsadresse)"
              value={country}
              onChange={(v) => {
                setCountry(v)
                if (!registrationDiffersFromAddress) setRegistrationCountry(v)
              }}
            />
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#6B7280" }}>
              <span style={{ color: "#24c598" }}>*</span> Pflichtfeld
            </p>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #E5E7EB" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.95rem", color: "#0A0A0A" }}>
            <input
              type="checkbox"
              checked={registrationDiffersFromAddress}
              onChange={(e) => {
                const checked = e.target.checked
                setRegistrationDiffersFromAddress(checked)
                if (!checked) setRegistrationCountry(country)
              }}
              style={{ width: "1rem", height: "1rem" }}
            />
            Rechtlicher Sitz weicht von der Geschäftsadresse ab
          </label>
          {registrationDiffersFromAddress && (
            <div style={{ marginTop: "1rem", maxWidth: "280px" }}>
              <CountrySelect
                id="registrationCountry"
                label="Land der Registrierung (rechtlicher Sitz)"
                value={registrationCountry}
                onChange={setRegistrationCountry}
              />
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#6B7280" }}>
                <span style={{ color: "#24c598" }}>*</span> Pflichtfeld bei abweichendem Sitz
              </p>
            </div>
          )}
        </div>

        {organization?.canEdit && (
        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: saving ? "#CDCDCD" : "#24c598",
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
        )}
      </div>
    </div>
  )
}

