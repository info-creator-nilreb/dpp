"use client"

export const dynamic = "force-dynamic"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

function ForgotPasswordContent() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      console.log("Sending password reset request for:", email)
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      console.log("Response status:", response.status, response.statusText)
      const data = await response.json()
      console.log("Reset password response:", { status: response.status, data })

      if (response.ok && data.success !== false) {
        setSuccess(true)
      } else {
        setError(data.message || data.error || "Ein Fehler ist aufgetreten")
      }
    } catch (err) {
      console.error("Forgot password error:", err)
      setError("Ein Fehler ist aufgetreten")
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
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
        <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="none"
            stroke="#24c598"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            style={{ width: "100%", height: "100%" }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <span style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: "700",
          color: "#0A0A0A"
        }}>
          Easy Pass
        </span>
      </Link>

      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #CDCDCD"
      }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Passwort vergessen?
          </h1>
          <p style={{
            color: "#7A7A7A",
            fontSize: "0.9rem"
          }}>
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
          </p>
        </div>

        {success ? (
          <div>
            <div style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#D4EDDA",
              border: "1px solid #C3E6CB",
              borderRadius: "6px",
              color: "#155724",
              fontSize: "0.9rem"
            }}>
              Wenn diese E-Mail-Adresse existiert, wurde ein Reset-Link gesendet. Bitte prüfen Sie Ihr Postfach.
            </div>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#24c598",
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "0.9rem",
                textAlign: "center",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: "0.75rem",
                marginBottom: "1rem",
                backgroundColor: "#FEE",
                border: "1px solid #FCC",
                borderRadius: "6px",
                color: "#C33",
                fontSize: "0.9rem"
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#0A0A0A",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                backgroundColor: loading ? "#CCCCCC" : "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "1rem"
              }}
            >
              {loading ? "Wird gesendet..." : "Reset-Link senden"}
            </button>

            <div style={{ textAlign: "center" }}>
              <Link
                href="/login"
                style={{
                  color: "#24c598",
                  textDecoration: "none",
                  fontSize: "0.9rem"
                }}
              >
                Zurück zum Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Lade...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  )
}

