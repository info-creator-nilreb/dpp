"use client"

import { useState } from "react"
import Link from "next/link"
import TPassLogo from "../components/TPassLogo"

/**
 * SUPER ADMIN FORGOT PASSWORD PAGE
 * 
 * Allows Super Admins to reset their password
 */
export default function SuperAdminForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch("/api/super-admin/auth/forgoeasy-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok && data.success !== false) {
        setSuccess(true)
      } else {
        setError(data.error || data.message || "Ein Fehler ist aufgetreten")
      }
    } catch (err) {
      console.error("Forgot password error:", err)
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F5F5F5",
      padding: "1rem"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "2rem",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
      }}>
        {/* Logo */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "2rem"
        }}>
          <TPassLogo size={64} color="#24c598" />
        </div>
        
        <h1 style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "0.5rem",
          textAlign: "center"
        }}>
          Passwort vergessen?
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "0.9rem",
          marginBottom: "2rem",
          textAlign: "center"
        }}>
          Geben Sie Ihre E-Mail-Adresse ein, um einen Passwort-Reset-Link zu erhalten
        </p>

        {error && (
          <div style={{
            backgroundColor: "#ECFDF5",
            border: "1px solid #24c598",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            color: "#24c598",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        {success ? (
          <div>
            <div style={{
              backgroundColor: "#F0FDF4",
              border: "1px solid #22C55E",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
              color: "#16A34A",
              fontSize: "0.9rem"
            }}>
              Ein Passwort-Reset-Link wurde an Ihre E-Mail-Adresse gesendet, falls ein Account mit dieser Adresse existiert.
            </div>
            <Link
              href="/super-admin/login"
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
                fontWeight: "600",
                textAlign: "center",
                textDecoration: "none",
                cursor: "pointer"
              }}
            >
              Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="email" style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #CDCDCD",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: loading ? "#CDCDCD" : "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                marginBottom: "1rem"
              }}
            >
              {loading ? "Wird gesendet..." : "Passwort-Reset-Link senden"}
            </button>

            <Link
              href="/super-admin/login"
              style={{
                display: "block",
                textAlign: "center",
                color: "#7A7A7A",
                textDecoration: "none",
                fontSize: "0.9rem"
              }}
            >
              Zurück zum Login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}

