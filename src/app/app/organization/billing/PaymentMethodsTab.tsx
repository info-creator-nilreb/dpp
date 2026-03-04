"use client"

import React, { useState, useEffect, useCallback } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import Notification from "@/components/Notification"
import { LoadingSpinner } from "@/components/LoadingSpinner"

const stripePublishableKey = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

export interface PaymentMethodInfo {
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  expiringSoon?: boolean
}

interface PaymentMethodResponse {
  paymentMethod: PaymentMethodInfo | null
  subscriptionCanceled?: boolean
  stripeConfigured?: boolean
}

function formatExpiry(month: number, year: number): string {
  const m = String(month).padStart(2, "0")
  const y = String(year).slice(-2)
  return `${m}/${y}`
}

function AddPaymentMethodForm({
  clientSecret,
  onSuccess,
  onCancel,
  saving,
  setSaving,
  setError,
}: {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
  saving: boolean
  setSaving: (v: boolean) => void
  setError: (v: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || saving) return
    const card = elements.getElement(CardElement)
    if (!card) return
    setSaving(true)
    setError("")
    try {
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card },
      })
      if (confirmError) {
        setError(confirmError.message ?? "Karte konnte nicht bestätigt werden.")
        setSaving(false)
        return
      }
      const pmId = setupIntent?.payment_method
      if (typeof pmId !== "string") {
        setError("Zahlungsmethode konnte nicht gespeichert werden.")
        setSaving(false)
        return
      }
      const res = await fetch("/api/app/organization/billing/payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: pmId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Speichern fehlgeschlagen.")
        setSaving(false)
        return
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: 400 }}>
      <div
        style={{
          padding: "0.75rem 1rem",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
          backgroundColor: "#FFF",
        }}
      >
        <label id="card-label" style={{ display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.5rem", color: "#374151" }}>
          Kartendaten
        </label>
        <CardElement
          options={{
            style: {
              base: { fontSize: "1rem", color: "#0A0A0A" },
              invalid: { color: "#B91C1C" },
            },
          }}
          aria-labelledby="card-label"
        />
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={!stripe || saving}
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: saving ? "#D1D5DB" : "#24c598",
            color: "#FFF",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            outlineOffset: "2px",
          }}
        >
          {saving ? "Wird gespeichert…" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: "transparent",
            color: "#6B7280",
            border: "1px solid #E5E5E5",
            borderRadius: "6px",
            fontWeight: 500,
            cursor: "pointer",
            outlineOffset: "2px",
          }}
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}

export default function PaymentMethodsTab() {
  const [data, setData] = useState<PaymentMethodResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/app/organization/billing/payment-method", { cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? "Fehler beim Laden")
        setData(null)
        return
      }
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleAddOrChange = async () => {
    setError("")
    try {
      const res = await fetch("/api/app/organization/billing/setup-intent", { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? "Setup konnte nicht gestartet werden.")
        return
      }
      if (json.clientSecret) {
        setClientSecret(json.clientSecret)
        setShowForm(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setClientSecret(null)
    setSuccess("Zahlungsmethode wurde gespeichert.")
    load()
  }

  const handleRemove = async () => {
    if (!window.confirm("Zahlungsmethode wirklich entfernen?")) return
    setRemoving(true)
    setError("")
    try {
      const res = await fetch("/api/app/organization/billing/payment-method", { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? "Entfernen fehlgeschlagen.")
        return
      }
      setSuccess("Zahlungsmethode wurde entfernt.")
      load()
    } finally {
      setRemoving(false)
    }
  }

  if (loading && !data) {
    return <LoadingSpinner message="Zahlungsarten werden geladen…" />
  }

  const stripeConfigured = data?.stripeConfigured === true
  const subscriptionCanceled = data?.subscriptionCanceled === true
  const disabled = subscriptionCanceled

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", boxSizing: "border-box" }}>
      {error && <Notification type="error" message={error} onClose={() => setError("")} duration={5000} />}
      {success && <Notification type="success" message={success} onClose={() => setSuccess("")} duration={4000} />}

      {!stripeConfigured && (
        <div
          style={{
            backgroundColor: "#F9FAFB",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            padding: "1.5rem",
            color: "#6B7280",
            fontSize: "0.95rem",
          }}
        >
          Zahlungsarten sind derzeit nicht verfügbar.
        </div>
      )}

      {stripeConfigured && !data?.paymentMethod && !showForm && (
        <div
          style={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E5E5",
            borderRadius: "12px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#374151", margin: 0 }}>Keine Zahlungsmethode hinterlegt</h2>
          <p style={{ color: "#6B7280", fontSize: "0.95rem", margin: 0 }}>
            Hinterlegen Sie eine Zahlungsmethode, um automatische Abbuchungen zu ermöglichen.
          </p>
          <button
            type="button"
            onClick={handleAddOrChange}
            disabled={disabled}
            aria-label="Zahlungsmethode hinzufügen"
            style={{
              alignSelf: "flex-start",
              padding: "0.75rem 1.25rem",
              backgroundColor: disabled ? "#E5E7EB" : "#24c598",
              color: "#FFF",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: disabled ? "not-allowed" : "pointer",
              outlineOffset: "2px",
            }}
          >
            Zahlungsmethode hinzufügen
          </button>
        </div>
      )}

      {stripeConfigured && data?.paymentMethod && !showForm && (
        <div
          style={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E5E5",
            borderRadius: "12px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            width: "100%",
            maxWidth: 480,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#6B7280",
                backgroundColor: "#F3F4F6",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              Standard-Zahlungsmethode
            </span>
            {data.paymentMethod.expiringSoon && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#92400E",
                  backgroundColor: "#FEF3C2",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                Läuft bald ab
              </span>
            )}
          </div>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#0A0A0A", margin: 0 }}>
            {data.paymentMethod.brand} **** {data.paymentMethod.last4}
          </p>
          <p style={{ fontSize: "0.9rem", color: "#6B7280", margin: 0 }}>
            Ablauf: {formatExpiry(data.paymentMethod.exp_month, data.paymentMethod.exp_year)}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={handleAddOrChange}
              disabled={disabled}
              aria-label="Zahlungsmethode ändern"
              style={{
                padding: "0.75rem 1.25rem",
                backgroundColor: "transparent",
                color: "#24c598",
                border: "1px solid #24c598",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                outlineOffset: "2px",
              }}
            >
              Zahlungsmethode ändern
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || removing}
              aria-label="Zahlungsmethode entfernen"
              style={{
                padding: "0.75rem 1.25rem",
                backgroundColor: "transparent",
                color: "#6B7280",
                border: "1px solid #E5E5E5",
                borderRadius: "6px",
                fontWeight: 500,
                cursor: disabled || removing ? "not-allowed" : "pointer",
                outlineOffset: "2px",
              }}
            >
              {removing ? "Wird entfernt…" : "Entfernen"}
            </button>
          </div>
        </div>
      )}

      {stripeConfigured && showForm && clientSecret && stripePromise && (
        <div
          style={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E5E5",
            borderRadius: "12px",
            padding: "2rem",
            width: "100%",
            maxWidth: 480,
            boxSizing: "border-box",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0A0A0A", marginTop: 0, marginBottom: "1rem" }}>
            Neue Zahlungsmethode
          </h3>
          <Elements stripe={stripePromise}>
            <AddPaymentMethodForm
              clientSecret={clientSecret}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false)
                setClientSecret(null)
              }}
              saving={saving}
              setSaving={setSaving}
              setError={setError}
            />
          </Elements>
        </div>
      )}
    </div>
  )
}
