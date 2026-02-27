"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import CountrySelect from "@/components/CountrySelect"
import VatIdInput from "@/components/VatIdInput"
import FileUploadArea from "@/components/FileUploadArea"
import { useNotification } from "@/components/NotificationProvider"
import { editorialColors } from "@/components/editorial/tokens/colors"

const DEFAULT_PRIMARY = editorialColors.brand.primary
const DEFAULT_SECONDARY = editorialColors.brand.secondary
const DEFAULT_ACCENT = editorialColors.brand.accent

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
  socialInstagram?: string | null
  socialFacebook?: string | null
  socialTiktok?: string | null
  socialPinterest?: string | null
  socialYoutube?: string | null
  socialLinkedin?: string | null
  defaultStyling?: {
    logo?: { url?: string; alt?: string }
    colors?: { primary?: string; secondary?: string; accent?: string }
  } | null
}

export default function CompanyDetailsClient() {
  const [organization, setOrganization] = useState<OrganizationBasic | null>(null)
  const [details, setDetails] = useState<CompanyDetails | null>(null)
  const [hasCmsStyling, setHasCmsStyling] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showNotification } = useNotification()

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
  const [socialInstagram, setSocialInstagram] = useState("")
  const [socialFacebook, setSocialFacebook] = useState("")
  const [socialTiktok, setSocialTiktok] = useState("")
  const [socialPinterest, setSocialPinterest] = useState("")
  const [socialYoutube, setSocialYoutube] = useState("")
  const [socialLinkedin, setSocialLinkedin] = useState("")
  // Styling-Defaults (nur bei Premium/cms_styling)
  const [stylingLogoUrl, setStylingLogoUrl] = useState("")
  const [stylingLogoAlt, setStylingLogoAlt] = useState("")
  const [stylingPrimaryColor, setStylingPrimaryColor] = useState<string>(DEFAULT_PRIMARY)
  const [stylingSecondaryColor, setStylingSecondaryColor] = useState<string>("")
  const [stylingAccentColor, setStylingAccentColor] = useState<string>("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const isUploadingLogoRef = useRef(false)
  const [showApplyStylingModal, setShowApplyStylingModal] = useState(false)
  const [applyingStyling, setApplyingStyling] = useState(false)
  const [applyStylingResult, setApplyStylingResult] = useState<{ applied: number; total: number } | null>(null)

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
        setSocialInstagram(companyDetails?.socialInstagram || "")
        setSocialFacebook(companyDetails?.socialFacebook || "")
        setSocialTiktok(companyDetails?.socialTiktok || "")
        setSocialPinterest(companyDetails?.socialPinterest || "")
        setSocialYoutube(companyDetails?.socialYoutube || "")
        setSocialLinkedin(companyDetails?.socialLinkedin || "")
        setHasCmsStyling(!!data.hasCmsStyling)
        const ds = companyDetails?.defaultStyling
        if (ds && typeof ds === "object") {
          if (!isUploadingLogoRef.current) {
            setStylingLogoUrl((ds as any).logo?.url || "")
          }
          setStylingLogoAlt((ds as any).logo?.alt || "")
          setStylingPrimaryColor((ds as any).colors?.primary || DEFAULT_PRIMARY)
          setStylingSecondaryColor((ds as any).colors?.secondary || "")
          setStylingAccentColor((ds as any).colors?.accent || "")
        } else {
          if (!isUploadingLogoRef.current) setStylingLogoUrl("")
          setStylingLogoAlt("")
          setStylingPrimaryColor(DEFAULT_PRIMARY)
          setStylingSecondaryColor("")
          setStylingAccentColor("")
        }
      }
    } catch (err) {
      console.error("Error loading company details:", err)
      showNotification("Fehler beim Laden der Firmendaten", "error")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (organization?.canEdit && !organizationName.trim()) {
      showNotification("Bitte geben Sie einen Organisationsnamen ein.", "error")
      return
    }
    const countryVal = country.trim()
    if (!countryVal) {
      showNotification("Bitte wählen Sie das Land der Geschäftsadresse.", "error")
      return
    }
    if (registrationDiffersFromAddress && !registrationCountry.trim()) {
      showNotification("Bitte wählen Sie das Land der Registrierung (rechtlicher Sitz).", "error")
      return
    }
    const registrationCountryVal = registrationDiffersFromAddress ? registrationCountry.trim() : countryVal
    setSaving(true)

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
          socialInstagram: socialInstagram.trim() || null,
          socialFacebook: socialFacebook.trim() || null,
          socialTiktok: socialTiktok.trim() || null,
          socialPinterest: socialPinterest.trim() || null,
          socialYoutube: socialYoutube.trim() || null,
          socialLinkedin: socialLinkedin.trim() || null,
          ...(hasCmsStyling ? {
            defaultStyling: {
              logo: stylingLogoUrl.trim() || stylingLogoAlt.trim()
                ? { url: stylingLogoUrl.trim() || undefined, alt: stylingLogoAlt.trim() || undefined }
                : undefined,
              colors: {
                primary: stylingPrimaryColor.trim() || undefined,
                secondary: stylingSecondaryColor.trim() || undefined,
                accent: stylingAccentColor.trim() || undefined,
              },
            },
          } : {}),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren der Firmendaten")
      }

      showNotification("Firmendaten erfolgreich aktualisiert", "success")
      await loadDetails()
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Fehler beim Aktualisieren der Firmendaten", "error")
    } finally {
      setSaving(false)
    }
  }

  /** Speichert Styling per PUT. Optional Overrides für sofortiges Speichern mit neuen Werten (State ist async). */
  async function saveStylingToServer(overrides?: {
    logoUrl?: string
    logoAlt?: string
    primary?: string
    secondary?: string
    accent?: string
  }) {
    if (!organization?.canEdit || !hasCmsStyling) return
    const countryVal = country.trim()
    const registrationCountryVal = registrationDiffersFromAddress ? registrationCountry.trim() : countryVal
    const logoUrl = overrides?.logoUrl ?? stylingLogoUrl
    const logoAlt = overrides?.logoAlt ?? stylingLogoAlt
    const primary = overrides?.primary ?? stylingPrimaryColor
    const secondary = overrides?.secondary ?? stylingSecondaryColor
    const accent = overrides?.accent ?? stylingAccentColor
    try {
      const res = await fetch("/api/app/organization/company-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
          socialInstagram: socialInstagram.trim() || null,
          socialFacebook: socialFacebook.trim() || null,
          socialTiktok: socialTiktok.trim() || null,
          socialPinterest: socialPinterest.trim() || null,
          socialYoutube: socialYoutube.trim() || null,
          socialLinkedin: socialLinkedin.trim() || null,
          defaultStyling: {
            logo: logoUrl.trim() || logoAlt.trim()
              ? { url: logoUrl.trim() || undefined, alt: logoAlt.trim() || undefined }
              : undefined,
            colors: {
              primary: primary.trim() || undefined,
              secondary: secondary.trim() || undefined,
              accent: accent.trim() || undefined,
            },
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Fehler beim Speichern")
      }
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Fehler beim Speichern des Stylings", "error")
    }
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    isUploadingLogoRef.current = true
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/app/organization/logo", { method: "POST", body: formData })
      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        throw new Error("Ungültige Antwort vom Server. Bitte versuchen Sie es erneut.")
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Fehler beim Hochladen (${response.status})`)
      }
      const result = await response.json()
      if (!result.media?.storageUrl) throw new Error("Keine Bild-URL erhalten")
      const newUrl = result.media.storageUrl
      setStylingLogoUrl(newUrl)
      await saveStylingToServer({ logoUrl: newUrl })
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Fehler beim Hochladen des Logos", "error")
    } finally {
      setUploadingLogo(false)
      isUploadingLogoRef.current = false
    }
  }

  function handleRemoveLogo() {
    setStylingLogoUrl("")
    setStylingLogoAlt("")
    saveStylingToServer({ logoUrl: "", logoAlt: "" })
  }

  function handleColorChange(
    colorType: "primary" | "secondary" | "accent",
    value: string
  ) {
    const primary = colorType === "primary" ? (value || DEFAULT_PRIMARY) : stylingPrimaryColor
    const secondary = colorType === "secondary" ? (value || "") : stylingSecondaryColor
    const accent = colorType === "accent" ? (value || "") : stylingAccentColor
    if (colorType === "primary") setStylingPrimaryColor(primary)
    else if (colorType === "secondary") setStylingSecondaryColor(secondary)
    else setStylingAccentColor(accent)
    saveStylingToServer({ primary, secondary, accent })
  }

  function handleRemoveColor(colorType: "secondary" | "accent") {
    if (colorType === "secondary") {
      setStylingSecondaryColor(DEFAULT_SECONDARY)
      saveStylingToServer({ secondary: DEFAULT_SECONDARY })
    } else {
      setStylingAccentColor(DEFAULT_ACCENT)
      saveStylingToServer({ accent: DEFAULT_ACCENT })
    }
  }

  async function handleApplyStylingToAllDpps() {
    setApplyingStyling(true)
    setApplyStylingResult(null)
    try {
      const res = await fetch("/api/app/organization/apply-default-styling", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Übernehmen")
      }
      setApplyStylingResult({ applied: data.applied ?? 0, total: data.total ?? 0 })
      if (data.errors?.length) {
        showNotification(data.errors.slice(0, 2).join("; "), "error")
      }
    } catch (e: unknown) {
      showNotification(e instanceof Error ? e.message : "Fehler beim Übernehmen des Stylings", "error")
    } finally {
      setApplyingStyling(false)
    }
  }

  function closeApplyStylingModal() {
    setShowApplyStylingModal(false)
    setApplyStylingResult(null)
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
          fontSize: "1.375rem",
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
          fontSize: "1.375rem",
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
          fontSize: "1.375rem",
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
              required
            />
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
                required
              />
            </div>
          )}
        </div>

        <h2 style={{
          fontSize: "1.375rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1.5rem",
          marginTop: "2rem",
        }}>
          Social-Media-Profile
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "1rem" }}>
          Diese Profile werden als Standard im Mehrwert-Block „Social Media“ in Ihren DPPs verwendet. Im Block können Sie sie pro DPP überschreiben oder entfernen.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { key: "instagram", label: "Instagram", value: socialInstagram, set: setSocialInstagram, placeholder: "https://instagram.com/..." },
            { key: "facebook", label: "Facebook", value: socialFacebook, set: setSocialFacebook, placeholder: "https://facebook.com/..." },
            { key: "tiktok", label: "TikTok", value: socialTiktok, set: setSocialTiktok, placeholder: "https://tiktok.com/@" },
            { key: "pinterest", label: "Pinterest", value: socialPinterest, set: setSocialPinterest, placeholder: "https://pinterest.com/..." },
            { key: "youtube", label: "YouTube", value: socialYoutube, set: setSocialYoutube, placeholder: "https://youtube.com/..." },
            { key: "linkedin", label: "LinkedIn", value: socialLinkedin, set: setSocialLinkedin, placeholder: "https://linkedin.com/company/..." },
          ].map(({ key, label, value, set, placeholder }) => (
            <div key={key}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#0A0A0A", fontWeight: "500", fontSize: "0.9rem" }}>
                {label}
              </label>
              <input
                type="url"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
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
          ))}
        </div>

        {hasCmsStyling && (
          <>
            <h2 style={{
              fontSize: "1.375rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1.5rem",
              marginTop: "2rem",
            }}>
              Styling (Standard für DPPs)
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "1.5rem" }}>
              Logo und Farben werden im DPP-Editor in der Vorschau als Vorgabe genutzt, sofern für einen DPP nichts anderes gesetzt ist.
            </p>

            {/* Logo – 1:1 wie StylingEditor: Thumbnail-Zeile oder FileUploadArea */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0A0A0A", marginBottom: "0.5rem" }}>
                Logo hochladen
              </h3>
              {stylingLogoUrl ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    border: "1px solid #E5E5E5",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F9F9F9",
                    overflow: "hidden",
                  }}>
                    <img
                      src={stylingLogoUrl}
                      alt={stylingLogoAlt || "Logo"}
                      style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", display: "block" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0A0A0A", marginBottom: "0.25rem" }}>Logo</div>
                    <div style={{ fontSize: "0.75rem", color: "#7A7A7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Hochgeladen</div>
                  </div>
                  {organization?.canEdit && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      style={{
                        padding: "0.5rem",
                        color: "#DC2626",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "4px",
                        transition: "background-color 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FEF2F2" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                      title="Logo entfernen"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <FileUploadArea
                  accept="image/*"
                  maxSize={2 * 1024 * 1024}
                  onFileSelect={handleLogoUpload}
                  disabled={!organization?.canEdit}
                  uploading={uploadingLogo}
                  description="PNG, JPG oder SVG (max. 2 MB)"
                />
              )}
            </div>

            {/* Farben – 1:1 wie StylingEditor: 32×32 Preview, Color-Picker, Hex-Text, optional Entfernen */}
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0A0A0A", marginBottom: "0.5rem" }}>
                Markenfarben definieren
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#7A7A7A", marginBottom: "0.5rem", lineHeight: 1.6 }}>
                Die Markenfarben werden in der öffentlichen Darstellung des Digitalen Produktpasses erscheinen.
              </p>
              <p style={{ fontSize: "0.75rem", color: "#9A9A9A", marginBottom: "1rem", lineHeight: 1.5 }}>
                Primär: Überschriften & Flächen · Sekundär: Text & Linien · Akzent: Buttons & Links
              </p>

              {/* Drei Farben platzsparend in einer Zeile */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "0.75rem",
              }}>
                {/* Primärfarbe */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      backgroundColor: stylingPrimaryColor,
                      border: "1px solid #E5E5E5",
                      flexShrink: 0,
                      cursor: organization?.canEdit ? "pointer" : "default",
                      position: "relative",
                    }}>
                      <input
                        type="color"
                        value={stylingPrimaryColor}
                        onChange={(e) => handleColorChange("primary", e.target.value)}
                        disabled={!organization?.canEdit}
                        style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                      />
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0A0A0A" }}>Primär</span>
                  </div>
                  <input
                    type="text"
                    value={stylingPrimaryColor}
                    onChange={(e) => handleColorChange("primary", e.target.value)}
                    disabled={!organization?.canEdit}
                    placeholder="#000000"
                    maxLength={7}
                    style={{
                      width: "100%",
                      padding: "0.375rem 0.5rem",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      border: "1px solid #E5E5E5",
                      borderRadius: "4px",
                      backgroundColor: "#FFFFFF",
                      color: "#0A0A0A",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Sekundärfarbe */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      backgroundColor: stylingSecondaryColor || "#F5F5F5",
                      border: "1px solid #E5E5E5",
                      flexShrink: 0,
                      cursor: organization?.canEdit ? "pointer" : "default",
                      position: "relative",
                      opacity: stylingSecondaryColor ? 1 : 0.5,
                    }}>
                      <input
                        type="color"
                        value={stylingSecondaryColor || "#666666"}
                        onChange={(e) => handleColorChange("secondary", e.target.value)}
                        disabled={!organization?.canEdit}
                        style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                      />
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0A0A0A" }}>Sekundär</span>
                    {organization?.canEdit && stylingSecondaryColor && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor("secondary")}
                        style={{
                          marginLeft: "auto",
                          padding: "0.25rem",
                          color: "#DC2626",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                        title="Farbe zurücksetzen"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={stylingSecondaryColor}
                    onChange={(e) => handleColorChange("secondary", e.target.value)}
                    disabled={!organization?.canEdit}
                    placeholder="Optional"
                    maxLength={7}
                    style={{
                      width: "100%",
                      padding: "0.375rem 0.5rem",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      border: "1px solid #E5E5E5",
                      borderRadius: "4px",
                      backgroundColor: "#FFFFFF",
                      color: "#0A0A0A",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Akzentfarbe */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      backgroundColor: stylingAccentColor || "#F5F5F5",
                      border: "1px solid #E5E5E5",
                      flexShrink: 0,
                      cursor: organization?.canEdit ? "pointer" : "default",
                      position: "relative",
                      opacity: stylingAccentColor ? 1 : 0.5,
                    }}>
                      <input
                        type="color"
                        value={stylingAccentColor || "#24c598"}
                        onChange={(e) => handleColorChange("accent", e.target.value)}
                        disabled={!organization?.canEdit}
                        style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                      />
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0A0A0A" }}>Akzent</span>
                    {organization?.canEdit && stylingAccentColor && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor("accent")}
                        style={{
                          marginLeft: "auto",
                          padding: "0.25rem",
                          color: "#DC2626",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                        title="Farbe zurücksetzen"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={stylingAccentColor}
                    onChange={(e) => handleColorChange("accent", e.target.value)}
                    disabled={!organization?.canEdit}
                    placeholder="Optional"
                    maxLength={7}
                    style={{
                      width: "100%",
                      padding: "0.375rem 0.5rem",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      border: "1px solid #E5E5E5",
                      borderRadius: "4px",
                      backgroundColor: "#FFFFFF",
                      color: "#0A0A0A",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {organization?.canEdit && (
                <div style={{ marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowApplyStylingModal(true)}
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      color: "#0A0A0A",
                      backgroundColor: "#F5F5F5",
                      border: "1px solid #E5E5E5",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Styling-Vorgaben in allen DPPs übernehmen
                  </button>
                  <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#7A7A7A" }}>
                    Setzt Logo und Markenfarben in allen bestehenden DPPs auf die obigen Vorgaben.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {showApplyStylingModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.target === e.currentTarget && !applyingStyling && closeApplyStylingModal()}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                padding: "1.5rem",
                maxWidth: "420px",
                width: "90%",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0A0A0A", marginBottom: "0.75rem" }}>
                Styling in allen DPPs übernehmen?
              </h3>
              {applyStylingResult === null ? (
                <>
                  <p style={{ fontSize: "0.875rem", color: "#4B5563", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                    Das aktuelle Logo und die Markenfarben werden in allen DPPs Ihrer Organisation gesetzt. Bestehende Abweichungen in einzelnen DPPs werden überschrieben.
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={closeApplyStylingModal}
                      disabled={applyingStyling}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        color: "#4B5563",
                        backgroundColor: "#F3F4F6",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        cursor: applyingStyling ? "not-allowed" : "pointer",
                      }}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyStylingToAllDpps}
                      disabled={applyingStyling}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        color: "#FFFFFF",
                        backgroundColor: applyingStyling ? "#9CA3AF" : "#24c598",
                        border: "none",
                        borderRadius: "6px",
                        cursor: applyingStyling ? "not-allowed" : "pointer",
                        fontWeight: 500,
                      }}
                    >
                      {applyingStyling ? "Wird übernommen…" : "Übernehmen"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "0.875rem", color: "#4B5563", lineHeight: 1.5, marginBottom: "1rem" }}>
                    {applyStylingResult.applied === applyStylingResult.total
                      ? `Styling wurde in allen ${applyStylingResult.total} DPP(s) übernommen.`
                      : `Styling wurde in ${applyStylingResult.applied} von ${applyStylingResult.total} DPP(s) übernommen.`}
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={closeApplyStylingModal}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        color: "#FFFFFF",
                        backgroundColor: "#24c598",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Schließen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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

