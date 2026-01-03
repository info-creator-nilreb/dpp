"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import InputField from "@/components/InputField"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DPP_SECTIONS } from "@/lib/dpp-sections"

interface DppData {
  id: string
  name: string
  organizationName: string
  materials?: string | null
  materialSource?: string | null
  careInstructions?: string | null
  isRepairable?: string | null
  sparePartsAvailable?: string | null
  lifespan?: string | null
  conformityDeclaration?: string | null
  disposalInfo?: string | null
  takebackOffered?: string | null
  takebackContact?: string | null
  secondLifeInfo?: string | null
}

interface TokenData {
  token: string
  partnerRole: string
  allowedSections: string[]
  message?: string | null
  dpp: DppData
}


function ContributeContent() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [status, setStatus] = useState<"loading" | "error" | "ready" | "submitting" | "success">("loading")
  const [error, setError] = useState("")
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [formData, setFormData] = useState<Partial<DppData>>({})
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setError("Token ist erforderlich")
      return
    }

    const loadToken = async () => {
      try {
        const response = await fetch(`/api/contribute/${token}`)
        const data = await response.json()

        if (!response.ok) {
          setStatus("error")
          setError(data.error || "Ungültiger oder abgelaufener Link")
          return
        }

        setTokenData(data)
        setFormData(data.dpp)
        setStatus("ready")
      } catch (err) {
        setStatus("error")
        setError("Ein Fehler ist aufgetreten")
      }
    }

    loadToken()
  }, [token])

  const handleSubmit = async () => {
    if (!confirmed) {
      setError("Bitte bestätigen Sie, dass die Informationen korrekt sind")
      return
    }

    setStatus("submitting")
    setError("")

    try {
      const response = await fetch(`/api/contribute/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          confirmed: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus("ready")
        setError(data.error || "Ein Fehler ist aufgetreten")
        return
      }

      setStatus("success")
    } catch (err) {
      setStatus("ready")
      setError("Ein Fehler ist aufgetreten")
    }
  }

  const getProgress = (): number => {
    if (!tokenData) return 0

    const allowedSections = tokenData.allowedSections
    let totalFields = 0
    let filledFields = 0

    allowedSections.forEach((section) => {
      switch (section) {
        case DPP_SECTIONS.MATERIALS:
          totalFields++
          if (formData.materials) filledFields++
          break
        case DPP_SECTIONS.MATERIAL_SOURCE:
          totalFields++
          if (formData.materialSource) filledFields++
          break
        case DPP_SECTIONS.CARE:
          totalFields++
          if (formData.careInstructions) filledFields++
          break
        case DPP_SECTIONS.REPAIR:
          totalFields += 2
          if (formData.isRepairable) filledFields++
          if (formData.sparePartsAvailable) filledFields++
          break
        case DPP_SECTIONS.LIFESPAN:
          totalFields++
          if (formData.lifespan) filledFields++
          break
        case DPP_SECTIONS.CONFORMITY:
          totalFields++
          if (formData.conformityDeclaration) filledFields++
          break
        case DPP_SECTIONS.DISPOSAL:
          totalFields++
          if (formData.disposalInfo) filledFields++
          break
        case DPP_SECTIONS.TAKEBACK:
          totalFields += 2
          if (formData.takebackOffered) filledFields++
          if (formData.takebackContact) filledFields++
          break
        case DPP_SECTIONS.SECOND_LIFE:
          totalFields++
          if (formData.secondLifeInfo) filledFields++
          break
      }
    })

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
  }

  const getSectionLabel = (section: string): string => {
    const labels: Record<string, string> = {
      [DPP_SECTIONS.MATERIALS]: "Materialien",
      [DPP_SECTIONS.MATERIAL_SOURCE]: "Materialherkunft",
      [DPP_SECTIONS.CARE]: "Pflegehinweise",
      [DPP_SECTIONS.REPAIR]: "Reparaturinformationen",
      [DPP_SECTIONS.LIFESPAN]: "Lebensdauer",
      [DPP_SECTIONS.CONFORMITY]: "Konformitätserklärung",
      [DPP_SECTIONS.DISPOSAL]: "Entsorgungsinformationen",
      [DPP_SECTIONS.TAKEBACK]: "Rücknahmeinformationen",
      [DPP_SECTIONS.SECOND_LIFE]: "Second-Life-Informationen",
    }
    return labels[section] || section
  }

  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#F5F5F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "800px",
          padding: "2rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
        }}>
          <LoadingSpinner message="Daten werden geladen..." />
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#F5F5F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "600px",
          padding: "2rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          textAlign: "center",
        }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ margin: "0 auto" }}
            >
              <circle cx="12" cy="12" r="10" fill="#E20074" />
              <path d="M9 9l6 6M15 9l-6 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#E20074",
            marginBottom: "0.5rem",
          }}>
            Ungültiger oder abgelaufener Link
          </h1>
          <p style={{ color: "#7A7A7A", marginBottom: "1.5rem" }}>
            {error || "Dieser Link ist ungültig oder abgelaufen. Bitte kontaktieren Sie die anfragende Organisation für einen neuen Link."}
          </p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#F5F5F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "600px",
          padding: "3rem 2rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}>
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              width: "80px",
              height: "80px",
              margin: "0 auto",
              borderRadius: "50%",
              backgroundColor: "#E20074",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)",
            }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M9 12l2 2 4-4" 
                  stroke="#FFFFFF" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
          </div>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "1rem",
            letterSpacing: "-0.02em",
          }}>
            Vielen Dank!
          </h1>
          <p style={{ 
            color: "#7A7A7A", 
            marginBottom: "2rem",
            fontSize: "1rem",
            lineHeight: "1.6",
          }}>
            Ihre Daten wurden erfolgreich übermittelt. Die anfragende Organisation wurde benachrichtigt.
          </p>
          <div style={{
            padding: "1rem",
            backgroundColor: "#F5F5F5",
            borderRadius: "8px",
            border: "1px solid #E5E5E5",
          }}>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              margin: 0,
            }}>
              Sie können dieses Fenster jetzt schließen.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenData) {
    return null
  }

  const progress = getProgress()

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F5F5F5",
      padding: "2rem",
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          marginBottom: "1.5rem",
        }}>
          <h1 style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "1rem",
          }}>
            Produktdaten bereitstellen
          </h1>
          <p style={{ color: "#7A7A7A", marginBottom: "1rem" }}>
            <strong>{tokenData.dpp.organizationName}</strong> benötigt Produktinformationen für <strong>{tokenData.dpp.name}</strong>.
          </p>
          <p style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>
            Diese Daten sind erforderlich, um den Anforderungen des EU Digital Product Passports zu entsprechen.
          </p>
          {tokenData.message && (
            <div style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#F5F5F5",
              borderRadius: "8px",
              border: "1px solid #CDCDCD",
            }}>
              <p style={{ color: "#0A0A0A", fontSize: "0.9rem", margin: 0 }}>
                <strong>Nachricht:</strong> {tokenData.message}
              </p>
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#0A0A0A" }}>
              Fortschritt
            </span>
            <span style={{ fontSize: "0.9rem", color: "#7A7A7A" }}>
              {progress}%
            </span>
          </div>
          <div style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#F5F5F5",
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#E20074",
              transition: "width 0.3s ease",
            }} />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#7A7A7A", margin: 0 }}>
              Erforderliche Bereiche:
            </p>
            <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", fontSize: "0.85rem", color: "#7A7A7A" }}>
              {tokenData.allowedSections.map((section) => (
                <li key={section}>{getSectionLabel(section)}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            padding: "2rem",
            borderRadius: "12px",
            border: "1px solid #CDCDCD",
            marginBottom: "1.5rem",
          }}>
            {tokenData.allowedSections.includes(DPP_SECTIONS.MATERIALS) && (
              <InputField
                id="materials"
                label="Materialien"
                value={formData.materials || ""}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                rows={4}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.MATERIAL_SOURCE) && (
              <InputField
                id="materialSource"
                label="Materialherkunft"
                value={formData.materialSource || ""}
                onChange={(e) => setFormData({ ...formData, materialSource: e.target.value })}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.CARE) && (
              <InputField
                id="careInstructions"
                label="Pflegehinweise"
                value={formData.careInstructions || ""}
                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                rows={3}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.REPAIR) && (
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="isRepairable" style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginBottom: "0.5rem",
                  }}>
                    Ist reparierbar
                  </label>
                  <select
                    id="isRepairable"
                    value={formData.isRepairable || ""}
                    onChange={(e) => setFormData({ ...formData, isRepairable: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      fontSize: "1rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      color: "#0A0A0A",
                    }}
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="YES">Ja</option>
                    <option value="NO">Nein</option>
                  </select>
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="sparePartsAvailable" style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginBottom: "0.5rem",
                  }}>
                    Ersatzteile verfügbar
                  </label>
                  <select
                    id="sparePartsAvailable"
                    value={formData.sparePartsAvailable || ""}
                    onChange={(e) => setFormData({ ...formData, sparePartsAvailable: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      fontSize: "1rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      color: "#0A0A0A",
                    }}
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="YES">Ja</option>
                    <option value="NO">Nein</option>
                  </select>
                </div>
              </>
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.LIFESPAN) && (
              <InputField
                id="lifespan"
                label="Lebensdauer"
                value={formData.lifespan || ""}
                onChange={(e) => setFormData({ ...formData, lifespan: e.target.value })}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.CONFORMITY) && (
              <InputField
                id="conformityDeclaration"
                label="Konformitätserklärung"
                value={formData.conformityDeclaration || ""}
                onChange={(e) => setFormData({ ...formData, conformityDeclaration: e.target.value })}
                rows={4}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.DISPOSAL) && (
              <InputField
                id="disposalInfo"
                label="Entsorgungsinformationen"
                value={formData.disposalInfo || ""}
                onChange={(e) => setFormData({ ...formData, disposalInfo: e.target.value })}
                rows={3}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.TAKEBACK) && (
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="takebackOffered" style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginBottom: "0.5rem",
                  }}>
                    Rücknahme angeboten
                  </label>
                  <select
                    id="takebackOffered"
                    value={formData.takebackOffered || ""}
                    onChange={(e) => setFormData({ ...formData, takebackOffered: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      fontSize: "1rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      color: "#0A0A0A",
                    }}
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="YES">Ja</option>
                    <option value="NO">Nein</option>
                  </select>
                </div>
                <InputField
                  id="takebackContact"
                  label="Rücknahmekontakt"
                  value={formData.takebackContact || ""}
                  onChange={(e) => setFormData({ ...formData, takebackContact: e.target.value })}
                />
              </>
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.SECOND_LIFE) && (
              <InputField
                id="secondLifeInfo"
                label="Second-Life-Informationen"
                value={formData.secondLifeInfo || ""}
                onChange={(e) => setFormData({ ...formData, secondLifeInfo: e.target.value })}
                rows={3}
              />
            )}

            {error && (
              <div style={{
                padding: "1rem",
                backgroundColor: "#FFF5F5",
                border: "1px solid #FEB2B2",
                borderRadius: "8px",
                marginBottom: "1.5rem",
              }}>
                <p style={{ color: "#C53030", margin: 0, fontSize: "0.9rem" }}>
                  {error}
                </p>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                cursor: "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  style={{
                    marginTop: "0.25rem",
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "0.9rem", color: "#0A0A0A" }}>
                  Ich bestätige, dass die bereitgestellten Informationen nach bestem Wissen korrekt sind.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                width: "100%",
                padding: "0.75rem 1.5rem",
                backgroundColor: status === "submitting" ? "#7A7A7A" : "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: status === "submitting" ? "not-allowed" : "pointer",
                transition: "background-color 0.2s ease",
              }}
            >
              {status === "submitting" ? "Wird übermittelt..." : "Daten übermitteln"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ContributePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#F5F5F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <LoadingSpinner message="Daten werden geladen..." />
      </div>
    }>
      <ContributeContent />
    </Suspense>
  )
}

