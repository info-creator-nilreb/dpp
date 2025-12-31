"use client"

import { useState, useEffect } from "react"
import ConfirmationModal from "@/components/super-admin/ConfirmationModal"
import SubscriptionChangeModal from "@/components/super-admin/SubscriptionChangeModal"
import { getFieldSensitivity, getHighestSensitivityLevel, requiresConfirmation, requiresReason } from "@/lib/phase1.5/organization-sensitivity"
import { getDisplayTier, isFreeTier } from "@/lib/phase1.7/subscription-state"

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  lastLoginAt: Date | null
}

interface Membership {
  id: string
  role: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

interface Organization {
  id: string
  name: string
  createdAt: Date
  licenseTier: string // Legacy field, kept for compatibility
  status: string
  // Phase 1: Company Details
  legalName: string | null
  companyType: string | null
  vatId: string | null
  commercialRegisterId: string | null
  addressStreet: string | null
  addressZip: string | null
  addressCity: string | null
  addressCountry: string | null
  country: string | null
  // Phase 1: Billing Information
  billingEmail: string | null
  billingContactUserId: string | null
  invoiceAddressStreet: string | null
  invoiceAddressZip: string | null
  invoiceAddressCity: string | null
  invoiceAddressCountry: string | null
  billingCountry: string | null
  // Phase 1.7: Subscription (for tier display)
  subscription: {
    id: string
    status: string
    subscriptionModelId: string | null
    subscriptionModel: {
      pricingPlan: {
        id: string
        name: string
      } | null
    } | null
    trialExpiresAt: Date | null
  } | null
  // Relations
  users: User[]
  memberships: Membership[]
  _count: {
    dpps: number
  }
}

interface OrganizationDetailContentProps {
  organization: Organization
  canEdit: boolean
}

/**
 * Organization Detail Content
 * 
 * Shows organization details, members, and actions
 * Phase 1: Includes Company Details and Billing Information
 */
export default function OrganizationDetailContent({
  organization: initialOrganization,
  canEdit
}: OrganizationDetailContentProps) {
  const [organization, setOrganization] = useState(initialOrganization)
  const [editing, setEditing] = useState<"basic" | "company" | "billing" | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingSave, setPendingSave] = useState<{ section: "basic" | "company" | "billing" | "subscription"; action?: "suspend" | "reactivate" } | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<Array<{ id: string; name: string }>>([])
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details")
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Load available plans for subscription modal
  useEffect(() => {
    if (showSubscriptionModal) {
      fetch("/api/super-admin/pricing/plans")
        .then(res => res.json())
        .then(data => {
          if (data.pricingPlans) {
            const plans = data.pricingPlans.flatMap((plan: any) =>
              plan.subscriptionModels?.map((model: any) => ({
                id: model.id,
                name: `${plan.name} (${model.billingInterval})`,
              })) || []
            )
            setAvailablePlans(plans)
          }
        })
        .catch(err => console.error("Error loading plans:", err))
    }
  }, [showSubscriptionModal])

  // Load audit logs when activity tab is active
  useEffect(() => {
    if (activeTab === "activity") {
      loadAuditLogs()
    }
  }, [activeTab, organization.id])

  async function loadAuditLogs() {
    setLoadingLogs(true)
    try {
      const response = await fetch(`/api/super-admin/organizations/${organization.id}/audit-logs`)
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.logs || [])
      }
    } catch (err) {
      console.error("Error loading audit logs:", err)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Form states
  const [formData, setFormData] = useState({
    name: organization.name,
    licenseTier: organization.licenseTier,
    status: organization.status,
    legalName: organization.legalName || "",
    companyType: organization.companyType || "",
    vatId: organization.vatId || "",
    commercialRegisterId: organization.commercialRegisterId || "",
    addressStreet: organization.addressStreet || "",
    addressZip: organization.addressZip || "",
    addressCity: organization.addressCity || "",
    addressCountry: organization.addressCountry || "",
    country: organization.country || "",
    billingEmail: organization.billingEmail || "",
    billingContactUserId: organization.billingContactUserId || "",
    invoiceAddressStreet: organization.invoiceAddressStreet || "",
    invoiceAddressZip: organization.invoiceAddressZip || "",
    invoiceAddressCity: organization.invoiceAddressCity || "",
    invoiceAddressCountry: organization.invoiceAddressCountry || "",
    billingCountry: organization.billingCountry || "",
  })

  const handleSave = async (section: "basic" | "company" | "billing", reason?: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const updateData: any = {}
      const changedFields: string[] = []
      
      if (section === "basic") {
        if (formData.name !== organization.name) {
          updateData.name = formData.name
          changedFields.push("name")
        }
        if (formData.licenseTier !== organization.licenseTier) {
          updateData.licenseTier = formData.licenseTier
          changedFields.push("licenseTier")
        }
        if (formData.status !== organization.status) {
          updateData.status = formData.status
          changedFields.push("status")
        }
      } else if (section === "company") {
        if ((formData.legalName || null) !== organization.legalName) {
          updateData.legalName = formData.legalName || null
          changedFields.push("legalName")
        }
        if ((formData.companyType || null) !== organization.companyType) {
          updateData.companyType = formData.companyType || null
          changedFields.push("companyType")
        }
        if ((formData.vatId || null) !== organization.vatId) {
          updateData.vatId = formData.vatId || null
          changedFields.push("vatId")
        }
        if ((formData.commercialRegisterId || null) !== organization.commercialRegisterId) {
          updateData.commercialRegisterId = formData.commercialRegisterId || null
          changedFields.push("commercialRegisterId")
        }
        if ((formData.addressStreet || null) !== organization.addressStreet) {
          updateData.addressStreet = formData.addressStreet || null
          changedFields.push("addressStreet")
        }
        if ((formData.addressZip || null) !== organization.addressZip) {
          updateData.addressZip = formData.addressZip || null
          changedFields.push("addressZip")
        }
        if ((formData.addressCity || null) !== organization.addressCity) {
          updateData.addressCity = formData.addressCity || null
          changedFields.push("addressCity")
        }
        if ((formData.addressCountry || null) !== organization.addressCountry) {
          updateData.addressCountry = formData.addressCountry || null
          changedFields.push("addressCountry")
        }
        if ((formData.country || null) !== organization.country) {
          updateData.country = formData.country || null
          changedFields.push("country")
        }
      } else if (section === "billing") {
        if ((formData.billingEmail || null) !== organization.billingEmail) {
          updateData.billingEmail = formData.billingEmail || null
          changedFields.push("billingEmail")
        }
        if (formData.billingContactUserId !== organization.billingContactUserId) {
          updateData.billingContactUserId = formData.billingContactUserId || null
          changedFields.push("billingContactUserId")
        }
        if ((formData.invoiceAddressStreet || null) !== organization.invoiceAddressStreet) {
          updateData.invoiceAddressStreet = formData.invoiceAddressStreet || null
          changedFields.push("invoiceAddressStreet")
        }
        if ((formData.invoiceAddressZip || null) !== organization.invoiceAddressZip) {
          updateData.invoiceAddressZip = formData.invoiceAddressZip || null
          changedFields.push("invoiceAddressZip")
        }
        if ((formData.invoiceAddressCity || null) !== organization.invoiceAddressCity) {
          updateData.invoiceAddressCity = formData.invoiceAddressCity || null
          changedFields.push("invoiceAddressCity")
        }
        if ((formData.invoiceAddressCountry || null) !== organization.invoiceAddressCountry) {
          updateData.invoiceAddressCountry = formData.invoiceAddressCountry || null
          changedFields.push("invoiceAddressCountry")
        }
        if ((formData.billingCountry || null) !== organization.billingCountry) {
          updateData.billingCountry = formData.billingCountry || null
          changedFields.push("billingCountry")
        }
      }

      if (changedFields.length === 0) {
        setEditing(null)
        setLoading(false)
        return
      }

      const requestBody: any = { 
        ...updateData,
        // Phase 1.6: Mandatory confirmation flag
        _confirmed: true,
      }
      if (reason) {
        requestBody.reason = reason
      }

      const response = await fetch(`/api/super-admin/organizations/${organization.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

          const data = await response.json()
          // Phase 1.9: Update organization state immediately to ensure consistency
          setOrganization(data.organization)
          setEditing(null)
          setSuccess("Änderungen erfolgreich gespeichert")
          setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClick = (section: "basic" | "company" | "billing") => {
    // Determine which fields would change
    const changedFields: string[] = []
    
    if (section === "basic") {
      if (formData.name !== organization.name) changedFields.push("name")
      if (formData.licenseTier !== organization.licenseTier) changedFields.push("licenseTier")
      if (formData.status !== organization.status) changedFields.push("status")
    } else if (section === "company") {
      if ((formData.legalName || null) !== organization.legalName) changedFields.push("legalName")
      if ((formData.companyType || null) !== organization.companyType) changedFields.push("companyType")
      if ((formData.vatId || null) !== organization.vatId) changedFields.push("vatId")
      if ((formData.commercialRegisterId || null) !== organization.commercialRegisterId) changedFields.push("commercialRegisterId")
      if ((formData.addressStreet || null) !== organization.addressStreet) changedFields.push("addressStreet")
      if ((formData.addressZip || null) !== organization.addressZip) changedFields.push("addressZip")
      if ((formData.addressCity || null) !== organization.addressCity) changedFields.push("addressCity")
      if ((formData.addressCountry || null) !== organization.addressCountry) changedFields.push("addressCountry")
      if ((formData.country || null) !== organization.country) changedFields.push("country")
    } else if (section === "billing") {
      if ((formData.billingEmail || null) !== organization.billingEmail) changedFields.push("billingEmail")
      if (formData.billingContactUserId !== organization.billingContactUserId) changedFields.push("billingContactUserId")
      if ((formData.invoiceAddressStreet || null) !== organization.invoiceAddressStreet) changedFields.push("invoiceAddressStreet")
      if ((formData.invoiceAddressZip || null) !== organization.invoiceAddressZip) changedFields.push("invoiceAddressZip")
      if ((formData.invoiceAddressCity || null) !== organization.invoiceAddressCity) changedFields.push("invoiceAddressCity")
      if ((formData.invoiceAddressCountry || null) !== organization.invoiceAddressCountry) changedFields.push("invoiceAddressCountry")
      if ((formData.billingCountry || null) !== organization.billingCountry) changedFields.push("billingCountry")
    }

    if (changedFields.length === 0) {
      setEditing(null)
      return
    }

    // Phase 1.8: ALWAYS require confirmation for Super Admin saves
    setPendingSave({ section })
    setShowConfirmation(true)
  }

  const handleConfirmSave = (reason?: string) => {
    if (pendingSave) {
      if (pendingSave.action === "suspend") {
        handleSuspend(reason || "")
      } else if (pendingSave.action === "reactivate") {
        handleReactivate(reason || "")
      } else if (pendingSave.section !== "subscription") {
        // Only call handleSave for basic, company, or billing sections
        handleSave(pendingSave.section as "basic" | "company" | "billing", reason)
      }
      // Note: subscription changes are handled via the subscription modal, not handleSave
      setPendingSave(null)
    }
    setShowConfirmation(false)
  }

  const handleSuspend = async (reason: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/super-admin/organizations/${organization.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "suspended", 
          reason,
          _confirmed: true, // Phase 1.6: Mandatory confirmation
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Sperren")
      }

      const data = await response.json()
      setOrganization(data.organization)
      setSuccess("Organisation wurde gesperrt")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Sperren")
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendClick = () => {
    setPendingSave({ section: "basic", action: "suspend" })
    setShowConfirmation(true)
  }

  const handleReactivate = async (reason: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/super-admin/organizations/${organization.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "active", 
          reason,
          _confirmed: true, // Phase 1.6: Mandatory confirmation
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Aktivieren")
      }

      const data = await response.json()
      setOrganization(data.organization)
      setSuccess("Organisation wurde aktiviert")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Aktivieren")
    } finally {
      setLoading(false)
    }
  }

  const handleReactivateClick = () => {
    setPendingSave({ section: "basic", action: "reactivate" })
    setShowConfirmation(true)
  }

  const renderField = (
    label: string,
    value: string | null | undefined,
    fieldName: string,
    section: "basic" | "company" | "billing",
    type: "text" | "select" = "text",
    options?: { value: string; label: string }[]
  ) => {
    const isEditing = editing === section
    const fieldValue = formData[fieldName as keyof typeof formData] || ""

    return (
      <div>
        <div style={{
          fontSize: "0.85rem",
          color: "#7A7A7A",
          marginBottom: "0.25rem"
        }}>
          {label}
        </div>
        {isEditing ? (
          type === "select" ? (
            <select
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #CDCDCD",
                borderRadius: "4px",
                fontSize: "0.9rem"
              }}
            >
              {options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #CDCDCD",
                borderRadius: "4px",
                fontSize: "0.9rem"
              }}
            />
          )
        ) : (
          <div style={{
            fontSize: "1rem",
            color: value ? "#0A0A0A" : "#7A7A7A",
            fontWeight: value ? "500" : "400",
            fontStyle: value ? "normal" : "italic"
          }}>
            {value || "Nicht gesetzt"}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      width: "100%",
      boxSizing: "border-box",
      overflowX: "hidden"
    }}>
      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        borderBottom: "1px solid #CDCDCD",
        marginBottom: "2rem",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        width: "100%"
      }}>
        <button
          onClick={() => setActiveTab("details")}
          style={{
            padding: "clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)",
            border: "none",
            backgroundColor: "transparent",
            color: activeTab === "details" ? "#E20074" : "#7A7A7A",
            fontWeight: activeTab === "details" ? "600" : "400",
            borderBottom: activeTab === "details" ? "2px solid #E20074" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          style={{
            padding: "clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)",
            border: "none",
            backgroundColor: "transparent",
            color: activeTab === "activity" ? "#E20074" : "#7A7A7A",
            fontWeight: activeTab === "activity" ? "600" : "400",
            borderBottom: activeTab === "activity" ? "2px solid #E20074" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Organisationsaktivität
        </button>
      </div>

      {activeTab === "details" && (
        <div style={{
          display: "grid",
          gap: "1.5rem"
        }}>
          {/* Phase 1.5: Super Admin Warning Banner */}
      <div style={{
        backgroundColor: "#FFF5F9",
        border: "2px solid #E20074",
        borderRadius: "8px",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}>
        <div style={{
          width: "24px",
          height: "24px",
          flexShrink: 0,
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="#E20074"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: "0.9rem",
            fontWeight: "600",
            color: "#E20074",
            marginBottom: "0.25rem",
          }}>
            Super Admin Ansicht
          </div>
          <div style={{
            fontSize: "0.85rem",
            color: "#0A0A0A",
          }}>
            Änderungen hier wirken sich direkt auf Kundenorganisationen aus. Alle Aktionen werden im Audit-Log erfasst.
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEE",
          border: "1px solid #FCC",
          borderRadius: "6px",
          color: "#C33"
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
          color: "#2E7D32"
        }}>
          {success}
        </div>
      )}

      {/* Basic Info */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#0A0A0A"
          }}>
            Grundinformationen
          </h2>
          {canEdit && (
            <button
              onClick={() => {
                if (editing === "basic") {
                  setEditing(null)
                } else {
                  setEditing("basic")
                  setFormData({
                    ...formData,
                    name: organization.name,
                    licenseTier: organization.licenseTier,
                    status: organization.status,
                  })
                }
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: editing === "basic" ? "#7A7A7A" : "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              {editing === "basic" ? "Abbrechen" : "Bearbeiten"}
            </button>
          )}
        </div>
        <div style={{
          display: "grid",
          gap: "1rem"
        }}>
          {renderField("Name", organization.name, "name", "basic")}
          {/* Phase 1.7: Display Tier (derived from subscription, not licenseTier) */}
          <div>
            <div style={{
              fontSize: "0.85rem",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Aktueller Tarif
            </div>
            <div style={{
              fontSize: "1rem",
              color: "#0A0A0A",
              fontWeight: "500"
            }}>
              {getDisplayTier(organization.subscription, organization.subscription?.subscriptionModel?.pricingPlan?.name || null)}
            </div>
          </div>
          {/* Legacy licenseTier field (read-only, for reference) */}
          {organization.licenseTier && (
            <div>
              <div style={{
                fontSize: "0.85rem",
                color: "#7A7A7A",
                marginBottom: "0.25rem"
              }}>
                Legacy License Tier (nur Referenz)
              </div>
              <div style={{
                fontSize: "0.85rem",
                color: "#7A7A7A",
                fontStyle: "italic"
              }}>
                {organization.licenseTier}
              </div>
            </div>
          )}
          {renderField("Status", organization.status, "status", "basic", "select", [
            { value: "active", label: "Aktiv" },
            { value: "suspended", label: "Gesperrt" },
            { value: "archived", label: "Archiviert" },
          ])}
          <div>
            <div style={{
              fontSize: "0.85rem",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Erstellt am
            </div>
            <div style={{
              fontSize: "1rem",
              color: "#0A0A0A"
            }}>
              {new Date(organization.createdAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: "0.85rem",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Anzahl DPPs
            </div>
            <div style={{
              fontSize: "1rem",
              color: "#0A0A0A"
            }}>
              {organization._count.dpps}
            </div>
          </div>
          {editing === "basic" && (
            <button
              onClick={() => handleSaveClick("basic")}
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginTop: "0.5rem"
              }}
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          )}
        </div>
      </div>

      {/* Phase 1: Company Details */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#0A0A0A"
          }}>
            Firmendaten
          </h2>
          {canEdit && (
            <button
              onClick={() => {
                if (editing === "company") {
                  setEditing(null)
                } else {
                  setEditing("company")
                  setFormData({
                    ...formData,
                    legalName: organization.legalName || "",
                    companyType: organization.companyType || "",
                    vatId: organization.vatId || "",
                    commercialRegisterId: organization.commercialRegisterId || "",
                    addressStreet: organization.addressStreet || "",
                    addressZip: organization.addressZip || "",
                    addressCity: organization.addressCity || "",
                    addressCountry: organization.addressCountry || "",
                    country: organization.country || "",
                  })
                }
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: editing === "company" ? "#7A7A7A" : "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              {editing === "company" ? "Abbrechen" : "Bearbeiten"}
            </button>
          )}
        </div>
        <div style={{
          display: "grid",
          gap: "1rem"
        }}>
          {renderField("Rechtlicher Name", organization.legalName, "legalName", "company")}
          {renderField("Unternehmensform", organization.companyType, "companyType", "company")}
          {renderField("USt-IdNr.", organization.vatId, "vatId", "company")}
          {renderField("Handelsregisternummer", organization.commercialRegisterId, "commercialRegisterId", "company")}
          {renderField("Straße", organization.addressStreet, "addressStreet", "company")}
          {renderField("PLZ", organization.addressZip, "addressZip", "company")}
          {renderField("Stadt", organization.addressCity, "addressCity", "company")}
          {renderField("Land (Adresse)", organization.addressCountry, "addressCountry", "company")}
          {renderField("Land (ISO)", organization.country, "country", "company")}
          {editing === "company" && (
            <button
              onClick={() => handleSaveClick("company")}
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginTop: "0.5rem"
              }}
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          )}
        </div>
      </div>

      {/* Phase 1: Billing Information */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#0A0A0A"
          }}>
            Rechnungsinformationen
          </h2>
          {canEdit && (
            <button
              onClick={() => {
                if (editing === "billing") {
                  setEditing(null)
                } else {
                  setEditing("billing")
                  setFormData({
                    ...formData,
                    billingEmail: organization.billingEmail || "",
                    billingContactUserId: organization.billingContactUserId || "",
                    invoiceAddressStreet: organization.invoiceAddressStreet || "",
                    invoiceAddressZip: organization.invoiceAddressZip || "",
                    invoiceAddressCity: organization.invoiceAddressCity || "",
                    invoiceAddressCountry: organization.invoiceAddressCountry || "",
                    billingCountry: organization.billingCountry || "",
                  })
                }
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: editing === "billing" ? "#7A7A7A" : "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              {editing === "billing" ? "Abbrechen" : "Bearbeiten"}
            </button>
          )}
        </div>
        <div style={{
          display: "grid",
          gap: "1rem"
        }}>
          {renderField("Rechnungs-E-Mail", organization.billingEmail, "billingEmail", "billing")}
          {renderField("Rechnungs-Kontakt (User ID)", organization.billingContactUserId, "billingContactUserId", "billing")}
          {renderField("Rechnungsadresse: Straße", organization.invoiceAddressStreet, "invoiceAddressStreet", "billing")}
          {renderField("Rechnungsadresse: PLZ", organization.invoiceAddressZip, "invoiceAddressZip", "billing")}
          {renderField("Rechnungsadresse: Stadt", organization.invoiceAddressCity, "invoiceAddressCity", "billing")}
          {renderField("Rechnungsadresse: Land", organization.invoiceAddressCountry, "invoiceAddressCountry", "billing")}
          {renderField("Rechnungsland (ISO)", organization.billingCountry, "billingCountry", "billing")}
          {editing === "billing" && (
            <button
              onClick={() => handleSaveClick("billing")}
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginTop: "0.5rem"
              }}
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          )}
        </div>
      </div>

      {/* Phase 1.8: Subscription Control (Super Admin only) */}
      {canEdit && (
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem"
          }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              Subscription
            </h2>
          </div>
          <div style={{
            display: "grid",
            gap: "1rem"
          }}>
            <div>
              <div style={{
                fontSize: "0.85rem",
                color: "#7A7A7A",
                marginBottom: "0.25rem"
              }}>
                Aktueller Plan
              </div>
              <div style={{
                fontSize: "1rem",
                color: "#0A0A0A",
                fontWeight: "500"
              }}>
                {organization.subscription?.subscriptionModel?.pricingPlan?.name || "Kein Plan"}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: "0.85rem",
                color: "#7A7A7A",
                marginBottom: "0.25rem"
              }}>
                Subscription-Status
              </div>
              <div style={{
                fontSize: "1rem",
                color: "#0A0A0A",
                fontWeight: "500"
              }}>
                {organization.subscription?.status || "abgelaufen"}
              </div>
            </div>
            {organization.subscription?.trialExpiresAt && (
              <div>
                <div style={{
                  fontSize: "0.85rem",
                  color: "#7A7A7A",
                  marginBottom: "0.25rem"
                }}>
                  Trial endet am
                </div>
                <div style={{
                  fontSize: "1rem",
                  color: "#0A0A0A"
                }}>
                  {new Date(organization.subscription.trialExpiresAt).toLocaleDateString("de-DE")}
                </div>
              </div>
            )}
            <button
              onClick={() => setShowSubscriptionModal(true)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "0.5rem"
              }}
            >
              Subscription ändern
            </button>
          </div>
        </div>
      )}

      {/* Phase 1: Users (instead of Memberships) */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#0A0A0A"
        }}>
          Benutzer ({organization.users.length})
        </h2>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}>
          {organization.users.length > 0 ? (
            organization.users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: "1rem",
                  backgroundColor: "#F5F5F5",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{
                    fontWeight: "500",
                    color: "#0A0A0A"
                  }}>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.lastName || user.email}
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "#7A7A7A"
                  }}>
                    {user.email}
                  </div>
                  {user.lastLoginAt && (
                    <div style={{
                      fontSize: "0.75rem",
                      color: "#7A7A7A",
                      marginTop: "0.25rem"
                    }}>
                      Letzter Login: {new Date(user.lastLoginAt).toLocaleDateString("de-DE")}
                    </div>
                  )}
                </div>
                <div style={{
                  padding: "0.25rem 0.75rem",
                  backgroundColor: user.status === "active" ? "#E8F5E9" : user.status === "suspended" ? "#FFEBEE" : "#FFF3E0",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  color: user.status === "active" ? "#2E7D32" : user.status === "suspended" ? "#C62828" : "#E65100"
                }}>
                  {user.status === "active" ? "Aktiv" : user.status === "suspended" ? "Gesperrt" : user.status}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: "1rem",
              textAlign: "center",
              color: "#7A7A7A"
            }}>
              Keine Benutzer gefunden
            </div>
          )}
        </div>
      </div>

      {/* Legacy Memberships (for compatibility) */}
      {organization.memberships.length > 0 && (
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: "#0A0A0A"
          }}>
            Legacy Mitgliedschaften ({organization.memberships.length})
          </h2>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            {organization.memberships.map((membership) => (
              <div
                key={membership.id}
                style={{
                  padding: "1rem",
                  backgroundColor: "#F5F5F5",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{
                    fontWeight: "500",
                    color: "#0A0A0A"
                  }}>
                    {membership.user.name || membership.user.email}
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "#7A7A7A"
                  }}>
                    {membership.user.email}
                  </div>
                </div>
                <div style={{
                  padding: "0.25rem 0.75rem",
                  backgroundColor: "#E8E8E8",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  color: "#0A0A0A"
                }}>
                  {membership.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #E20074",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            marginBottom: "0.75rem",
            color: "#E20074"
          }}>
            Aktionen
          </h2>
          <div style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap"
          }}>
            {organization.status !== "suspended" && (
              <button
                onClick={handleSuspendClick}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#E20074",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? "Wird gesperrt..." : "Organisation sperren"}
              </button>
            )}
            {organization.status === "suspended" && (
              <button
                onClick={handleReactivateClick}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#22C55E",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? "Wird aktiviert..." : "Organisation aktivieren"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Phase 1.5: Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false)
          setPendingSave(null)
        }}
        onConfirm={(reason) => {
          handleConfirmSave(reason)
        }}
        title="Organisationsänderungen bestätigen"
        message={
          pendingSave?.action === "suspend"
            ? "Sie sind dabei, diese Organisation zu sperren. Dies verhindert alle Logins und API-Zugriffe. Bitte geben Sie einen Grund an."
            : pendingSave?.action === "reactivate"
            ? "Sie sind dabei, diese Organisation zu reaktivieren. Bitte geben Sie einen Grund an."
            : "Sie sind dabei, Live-Kundendaten zu ändern.\nDiese Änderungen treten sofort in Kraft."
        }
        severity={
          pendingSave?.action === "suspend" || pendingSave?.action === "reactivate"
            ? "high"
            : (() => {
                // Determine changed fields for this section
                const changedFields: string[] = []
                if (pendingSave?.section === "company") {
                  if ((formData.legalName || null) !== organization.legalName) changedFields.push("legalName")
                  if ((formData.companyType || null) !== organization.companyType) changedFields.push("companyType")
                  if ((formData.vatId || null) !== organization.vatId) changedFields.push("vatId")
                  if ((formData.commercialRegisterId || null) !== organization.commercialRegisterId) changedFields.push("commercialRegisterId")
                  if ((formData.addressStreet || null) !== organization.addressStreet) changedFields.push("addressStreet")
                  if ((formData.addressZip || null) !== organization.addressZip) changedFields.push("addressZip")
                  if ((formData.addressCity || null) !== organization.addressCity) changedFields.push("addressCity")
                  if ((formData.addressCountry || null) !== organization.addressCountry) changedFields.push("addressCountry")
                  if ((formData.country || null) !== organization.country) changedFields.push("country")
                } else if (pendingSave?.section === "billing") {
                  if ((formData.billingEmail || null) !== organization.billingEmail) changedFields.push("billingEmail")
                  if (formData.billingContactUserId !== organization.billingContactUserId) changedFields.push("billingContactUserId")
                  if ((formData.invoiceAddressStreet || null) !== organization.invoiceAddressStreet) changedFields.push("invoiceAddressStreet")
                  if ((formData.invoiceAddressZip || null) !== organization.invoiceAddressZip) changedFields.push("invoiceAddressZip")
                  if ((formData.invoiceAddressCity || null) !== organization.invoiceAddressCity) changedFields.push("invoiceAddressCity")
                  if ((formData.invoiceAddressCountry || null) !== organization.invoiceAddressCountry) changedFields.push("invoiceAddressCountry")
                  if ((formData.billingCountry || null) !== organization.billingCountry) changedFields.push("billingCountry")
                }
                return getHighestSensitivityLevel(changedFields) === "high" ? "high" : "medium"
              })()
        }
        requireReason={
          pendingSave?.action === "suspend" || pendingSave?.action === "reactivate" ||
          (pendingSave?.section && (() => {
            const changedFields: string[] = []
            if (pendingSave.section === "basic") {
              if (formData.name !== organization.name) changedFields.push("name")
              if (formData.status !== organization.status) changedFields.push("status")
            } else if (pendingSave.section === "company") {
              if ((formData.legalName || null) !== organization.legalName) changedFields.push("legalName")
              if ((formData.companyType || null) !== organization.companyType) changedFields.push("companyType")
              if ((formData.vatId || null) !== organization.vatId) changedFields.push("vatId")
              if ((formData.commercialRegisterId || null) !== organization.commercialRegisterId) changedFields.push("commercialRegisterId")
              if ((formData.addressStreet || null) !== organization.addressStreet) changedFields.push("addressStreet")
              if ((formData.addressZip || null) !== organization.addressZip) changedFields.push("addressZip")
              if ((formData.addressCity || null) !== organization.addressCity) changedFields.push("addressCity")
              if ((formData.addressCountry || null) !== organization.addressCountry) changedFields.push("addressCountry")
              if ((formData.country || null) !== organization.country) changedFields.push("country")
            } else if (pendingSave.section === "billing") {
              if ((formData.billingEmail || null) !== organization.billingEmail) changedFields.push("billingEmail")
              if (formData.billingContactUserId !== organization.billingContactUserId) changedFields.push("billingContactUserId")
              if ((formData.invoiceAddressStreet || null) !== organization.invoiceAddressStreet) changedFields.push("invoiceAddressStreet")
              if ((formData.invoiceAddressZip || null) !== organization.invoiceAddressZip) changedFields.push("invoiceAddressZip")
              if ((formData.invoiceAddressCity || null) !== organization.invoiceAddressCity) changedFields.push("invoiceAddressCity")
              if ((formData.invoiceAddressCountry || null) !== organization.invoiceAddressCountry) changedFields.push("invoiceAddressCountry")
              if ((formData.billingCountry || null) !== organization.billingCountry) changedFields.push("billingCountry")
            }
            // Phase 1.8: Critical fields that always require reason
            const criticalFields = ["legalName", "vatId", "billingEmail", "status"]
            const hasCriticalChange = changedFields.some(field => criticalFields.includes(field))
            return hasCriticalChange || requiresReason(changedFields)
          })())
        }
        changedFields={
          pendingSave?.action === "suspend" || pendingSave?.action === "reactivate"
            ? ["status"]
            : (() => {
                const changedFields: string[] = []
                if (pendingSave?.section === "company") {
                  if ((formData.legalName || null) !== organization.legalName) changedFields.push("legalName")
                  if ((formData.companyType || null) !== organization.companyType) changedFields.push("companyType")
                  if ((formData.vatId || null) !== organization.vatId) changedFields.push("vatId")
                  if ((formData.commercialRegisterId || null) !== organization.commercialRegisterId) changedFields.push("commercialRegisterId")
                  if ((formData.addressStreet || null) !== organization.addressStreet) changedFields.push("addressStreet")
                  if ((formData.addressZip || null) !== organization.addressZip) changedFields.push("addressZip")
                  if ((formData.addressCity || null) !== organization.addressCity) changedFields.push("addressCity")
                  if ((formData.addressCountry || null) !== organization.addressCountry) changedFields.push("addressCountry")
                  if ((formData.country || null) !== organization.country) changedFields.push("country")
                } else if (pendingSave?.section === "billing") {
                  if ((formData.billingEmail || null) !== organization.billingEmail) changedFields.push("billingEmail")
                  if (formData.billingContactUserId !== organization.billingContactUserId) changedFields.push("billingContactUserId")
                  if ((formData.invoiceAddressStreet || null) !== organization.invoiceAddressStreet) changedFields.push("invoiceAddressStreet")
                  if ((formData.invoiceAddressZip || null) !== organization.invoiceAddressZip) changedFields.push("invoiceAddressZip")
                  if ((formData.invoiceAddressCity || null) !== organization.invoiceAddressCity) changedFields.push("invoiceAddressCity")
                  if ((formData.invoiceAddressCountry || null) !== organization.invoiceAddressCountry) changedFields.push("invoiceAddressCountry")
                  if ((formData.billingCountry || null) !== organization.billingCountry) changedFields.push("billingCountry")
                }
                return changedFields
              })()
        }
      />

      {/* Phase 1.8: Subscription Change Modal */}
      <SubscriptionChangeModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onConfirm={async (data) => {
          setLoading(true)
          setError(null)
          try {
            const response = await fetch(`/api/super-admin/organizations/${organization.id}/subscription`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: data.status,
                subscriptionModelId: data.subscriptionModelId,
                reason: data.reason,
                _confirmed: true,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || "Fehler beim Ändern der Subscription")
            }

            const result = await response.json()
            setOrganization(result.organization)
            setShowSubscriptionModal(false)
            setSuccess("Subscription erfolgreich geändert")
            setTimeout(() => setSuccess(null), 3000)
          } catch (err: any) {
            setError(err.message || "Fehler beim Ändern der Subscription")
          } finally {
            setLoading(false)
          }
        }}
        currentStatus={organization.subscription?.status || null}
        currentPlanName={organization.subscription?.subscriptionModel?.pricingPlan?.name || null}
        availablePlans={availablePlans}
      />
        </div>
      )}

      {activeTab === "activity" && (
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          padding: "clamp(1rem, 2vw, 1.5rem)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h2 style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.25rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "1.5rem"
          }}>
            Organisationsaktivität
          </h2>
          {loadingLogs ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <div style={{ color: "#7A7A7A" }}>Lade Aktivitätsprotokoll...</div>
            </div>
          ) : auditLogs.length === 0 ? (
            <p style={{ color: "#7A7A7A", textAlign: "center", padding: "2rem" }}>
              Keine Aktivitäten gefunden
            </p>
          ) : (
            <div style={{ 
              overflowX: "auto",
              width: "100%",
              WebkitOverflowScrolling: "touch"
            }}>
              <table style={{ 
                width: "100%", 
                minWidth: "700px",
                borderCollapse: "collapse" 
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#F5F5F5", borderBottom: "1px solid #CDCDCD" }}>
                    <th style={{ 
                      padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                      textAlign: "left", 
                      fontSize: "clamp(0.8rem, 2vw, 0.85rem)", 
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}>
                      Zeitpunkt
                    </th>
                    <th style={{ 
                      padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                      textAlign: "left", 
                      fontSize: "clamp(0.8rem, 2vw, 0.85rem)", 
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}>
                      Aktion
                    </th>
                    <th style={{ 
                      padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                      textAlign: "left", 
                      fontSize: "clamp(0.8rem, 2vw, 0.85rem)", 
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}>
                      Akteur
                    </th>
                    <th style={{ 
                      padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                      textAlign: "left", 
                      fontSize: "clamp(0.8rem, 2vw, 0.85rem)", 
                      fontWeight: "600"
                    }}>
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                      <td style={{ 
                        padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                        fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)", 
                        color: "#7A7A7A",
                        whiteSpace: "nowrap"
                      }}>
                        {new Date(log.timestamp || log.createdAt).toLocaleString("de-DE")}
                      </td>
                      <td style={{ 
                        padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                        fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)", 
                        color: "#0A0A0A",
                        wordBreak: "break-word"
                      }}>
                        {log.actionType}
                      </td>
                      <td style={{ 
                        padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                        fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)", 
                        color: "#0A0A0A",
                        wordBreak: "break-word"
                      }}>
                        {log.actorRole || "—"}
                      </td>
                      <td style={{ 
                        padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                        fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)", 
                        color: "#0A0A0A",
                        wordBreak: "break-word",
                        maxWidth: "300px"
                      }}>
                        {log.metadata ? JSON.stringify(log.metadata) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
