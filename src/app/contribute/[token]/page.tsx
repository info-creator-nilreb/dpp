"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import InputField from "@/components/InputField"
import { DPP_SECTIONS } from "@/lib/permissions"

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

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "spin 1s linear infinite" }}
      >
        <circle cx="12" cy="12" r="10" stroke="#E20074" strokeWidth="2" strokeOpacity="0.25" />
        <path
          d="M12 2C6.477 2 2 6.477 2 12"
          stroke="#E20074"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
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
      setError("Token is required")
      return
    }

    const loadToken = async () => {
      try {
        const response = await fetch(`/api/contribute/${token}`)
        const data = await response.json()

        if (!response.ok) {
          setStatus("error")
          setError(data.error || "Invalid or expired token")
          return
        }

        setTokenData(data)
        setFormData(data.dpp)
        setStatus("ready")
      } catch (err) {
        setStatus("error")
        setError("An error occurred")
      }
    }

    loadToken()
  }, [token])

  const handleSubmit = async () => {
    if (!confirmed) {
      setError("Please confirm that the information is correct")
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
        setError(data.error || "An error occurred")
        return
      }

      setStatus("success")
    } catch (err) {
      setStatus("ready")
      setError("An error occurred")
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
      [DPP_SECTIONS.MATERIALS]: "Materials",
      [DPP_SECTIONS.MATERIAL_SOURCE]: "Material Source",
      [DPP_SECTIONS.CARE]: "Care Instructions",
      [DPP_SECTIONS.REPAIR]: "Repair Information",
      [DPP_SECTIONS.LIFESPAN]: "Lifespan",
      [DPP_SECTIONS.CONFORMITY]: "Conformity Declaration",
      [DPP_SECTIONS.DISPOSAL]: "Disposal Information",
      [DPP_SECTIONS.TAKEBACK]: "Takeback Information",
      [DPP_SECTIONS.SECOND_LIFE]: "Second Life Information",
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
          <LoadingSpinner />
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}>
            Loading...
          </h1>
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
            Invalid or Expired Link
          </h1>
          <p style={{ color: "#7A7A7A", marginBottom: "1.5rem" }}>
            {error || "This link is invalid or has expired. Please contact the requesting organization for a new link."}
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
              <circle cx="12" cy="12" r="10" fill="#00A651" />
              <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#00A651",
            marginBottom: "0.5rem",
          }}>
            Thank You!
          </h1>
          <p style={{ color: "#7A7A7A", marginBottom: "1.5rem" }}>
            Your data has been successfully submitted. The requesting organization has been notified.
          </p>
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
            Provide Product Data
          </h1>
          <p style={{ color: "#7A7A7A", marginBottom: "1rem" }}>
            <strong>{tokenData.dpp.organizationName}</strong> is requesting product information for <strong>{tokenData.dpp.name}</strong>.
          </p>
          <p style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>
            This data is needed to comply with EU Digital Product Passport requirements.
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
                <strong>Message:</strong> {tokenData.message}
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
              Progress
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
              Required sections:
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
                label="Materials"
                value={formData.materials || ""}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                rows={4}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.MATERIAL_SOURCE) && (
              <InputField
                id="materialSource"
                label="Material Source"
                value={formData.materialSource || ""}
                onChange={(e) => setFormData({ ...formData, materialSource: e.target.value })}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.CARE) && (
              <InputField
                id="careInstructions"
                label="Care Instructions"
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
                    Is Repairable
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
                    <option value="">Please select</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
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
                    Spare Parts Available
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
                    <option value="">Please select</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
              </>
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.LIFESPAN) && (
              <InputField
                id="lifespan"
                label="Lifespan"
                value={formData.lifespan || ""}
                onChange={(e) => setFormData({ ...formData, lifespan: e.target.value })}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.CONFORMITY) && (
              <InputField
                id="conformityDeclaration"
                label="Conformity Declaration"
                value={formData.conformityDeclaration || ""}
                onChange={(e) => setFormData({ ...formData, conformityDeclaration: e.target.value })}
                rows={4}
              />
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.DISPOSAL) && (
              <InputField
                id="disposalInfo"
                label="Disposal Information"
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
                    Takeback Offered
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
                    <option value="">Please select</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
                <InputField
                  id="takebackContact"
                  label="Takeback Contact"
                  value={formData.takebackContact || ""}
                  onChange={(e) => setFormData({ ...formData, takebackContact: e.target.value })}
                />
              </>
            )}

            {tokenData.allowedSections.includes(DPP_SECTIONS.SECOND_LIFE) && (
              <InputField
                id="secondLifeInfo"
                label="Second Life Information"
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
                  I confirm that the information provided is correct to the best of my knowledge.
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
              }}
            >
              {status === "submitting" ? "Submitting..." : "Submit Data"}
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
        <LoadingSpinner />
      </div>
    }>
      <ContributeContent />
    </Suspense>
  )
}

