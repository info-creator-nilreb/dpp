"use client"

import { useState } from "react"

interface SubscriptionChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    status: string
    subscriptionModelId?: string
    reason: string
  }) => void
  currentStatus: string | null
  currentPlanName: string | null
  availablePlans?: Array<{
    id: string
    name: string
  }>
}

/**
 * Subscription Change Modal for Super Admin
 * 
 * Allows Super Admin to change subscription status and plan
 * Always requires a reason
 */
export default function SubscriptionChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  currentPlanName,
  availablePlans = [],
}: SubscriptionChangeModalProps) {
  const [status, setStatus] = useState(currentStatus || "expired")
  const [subscriptionModelId, setSubscriptionModelId] = useState<string>("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Bitte geben Sie einen Grund an (mindestens 10 Zeichen).")
      return
    }

    onConfirm({
      status,
      subscriptionModelId: subscriptionModelId || undefined,
      reason: reason.trim(),
    })

    // Reset form
    setReason("")
    setError(null)
  }

  const handleClose = () => {
    setReason("")
    setError(null)
    setStatus(currentStatus || "expired")
    setSubscriptionModelId("")
    onClose()
  }

  const canConfirm = reason.trim().length >= 10

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
          border: "2px solid #E20074",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#FFF5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#E20074",
              marginBottom: "0.25rem",
            }}>
              Abonnement-Status ändern
            </h2>
            <div style={{
              fontSize: "0.75rem",
              color: "#E20074",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              Hochrisiko-Änderung
            </div>
          </div>
        </div>

        {/* Current State */}
        <div style={{
          padding: "1rem",
          backgroundColor: "#F5F5F5",
          borderRadius: "6px",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            fontSize: "0.85rem",
            color: "#7A7A7A",
            marginBottom: "0.5rem",
          }}>
            Aktueller Status:
          </div>
          <div style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#0A0A0A",
          }}>
            {(() => {
              const status = currentStatus || "expired"
              const statusMap: Record<string, string> = {
                "active": "Aktiv",
                "trial_active": "Testphase",
                "trial": "Testphase",
                "expired": "Abgelaufen",
                "canceled": "Gekündigt",
                "past_due": "Überfällig"
              }
              return statusMap[status] || status
            })()} {currentPlanName && `(${currentPlanName})`}
          </div>
        </div>

        {/* Subscription Status */}
        <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem",
            }}>
              Status <span style={{ color: "#E20074" }}>*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            >
              <option value="trial">Testphase</option>
              <option value="active">Aktiv</option>
              <option value="expired">Abgelaufen</option>
              <option value="canceled">Gekündigt</option>
            </select>
        </div>

        {/* Plan Selection (optional) */}
        {availablePlans.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem",
            }}>
              Plan (optional)
            </label>
            <select
              value={subscriptionModelId}
              onChange={(e) => setSubscriptionModelId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            >
              <option value="">Kein Plan zugewiesen</option>
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reason Input (mandatory) */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "0.9rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem",
          }}>
            Grund für die Änderung <span style={{ color: "#E20074" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError(null)
            }}
            placeholder="Bitte geben Sie einen Grund für diese Änderung an (mindestens 10 Zeichen)..."
            rows={4}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: error ? "1px solid #E20074" : "1px solid #CDCDCD",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{
              marginTop: "0.5rem",
              fontSize: "0.85rem",
              color: "#E20074",
            }}>
              {error}
            </div>
          )}
          <div style={{
            marginTop: "0.25rem",
            fontSize: "0.75rem",
            color: "#7A7A7A",
          }}>
            {reason.length}/10 Zeichen (mindestens 10 erforderlich)
          </div>
        </div>

        {/* Warning Banner */}
        <div style={{
          padding: "1rem",
          backgroundColor: "#FFF5F9",
          border: "1px solid #E20074",
          borderRadius: "6px",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            fontSize: "0.85rem",
            color: "#E20074",
            fontWeight: "500",
          }}>
            ⚠️ Diese Änderung wirkt sich direkt auf die Subscription der Organisation aus und wird im Audit-Log erfasst.
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "0.75rem 1.5rem",
              backgroundColor: "transparent",
              color: "#0A0A0A",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              flex: 1,
              padding: "0.75rem 1.5rem",
              backgroundColor: canConfirm ? "#E20074" : "#CDCDCD",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: canConfirm ? "pointer" : "not-allowed",
              opacity: canConfirm ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (canConfirm) {
                e.currentTarget.style.backgroundColor = "#C1005F"
              }
            }}
            onMouseLeave={(e) => {
              if (canConfirm) {
                e.currentTarget.style.backgroundColor = "#E20074"
              }
            }}
          >
            Änderung bestätigen
          </button>
        </div>
      </div>
    </div>
  )
}

