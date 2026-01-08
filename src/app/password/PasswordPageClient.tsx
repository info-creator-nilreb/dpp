"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LoginSplitLayout } from "@/components/LoginSplitLayout"

interface PasswordPageClientProps {
  callbackUrl: string
}

export default function PasswordPageClient({ callbackUrl }: PasswordPageClientProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) {
      return
    }
    
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, callbackUrl }),
        credentials: "include", // Wichtig: Cookies werden mitgesendet
        redirect: "manual" // Manuelles Handling von Redirects
      })

      // Server-Side Redirect (Status 302/307/308)
      if (response.status >= 300 && response.status < 400) {
        // Server hat einen Redirect gemacht - Cookie ist im Response-Header
        // Hole die Redirect-URL aus dem Location-Header
        const redirectUrl = response.headers.get("Location") || callbackUrl || "/"
        // Navigiere explizit - das Cookie ist bereits gesetzt
        window.location.href = redirectUrl
        return
      }

      // Erfolgreiche Response (Status 200-299)
      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        // Cookie ist bereits gesetzt, navigiere zur callbackUrl
        const redirectUrl = data.callbackUrl || callbackUrl || "/"
        window.location.href = redirectUrl
        return
      }

      // Fehlerfall: Response prüfen
      const data = await response.json().catch(() => ({ error: "Ungültiges Passwort" }))
      setError(data.error || "Ungültiges Passwort")
      setLoading(false)
    } catch (err: any) {
      setError("Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  return (
    <LoginSplitLayout
      title="Zugriff geschützt"
      subtitle="Diese Anwendung ist derzeit im geschützten Modus."
      quote={{
        text: "Sicherheit ist kein Zustand, sondern ein Prozess.",
        author: "Bruce Schneier"
      }}
    >
      {/* Logo über der Card */}
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
        padding: "clamp(1.5rem, 4vw, 2rem)",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        boxSizing: "border-box",
      }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Passwort eingeben
          </h1>
          <p style={{
            fontSize: "0.95rem",
            color: "#7A7A7A",
            lineHeight: "1.5"
          }}>
            Bitte geben Sie das Zugriffspasswort ein, um fortzufahren.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
              Passwort
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="curreneasy-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  paddingRight: "3rem",
                  border: "1px solid #CDCDCD",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem",
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#24c598"
                }}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
              marginBottom: "1rem"
            }}
          >
            {loading ? "Wird geprüft..." : "Weiter"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#7A7A7A", fontSize: "0.85rem", lineHeight: "1.5" }}>
          Sie haben kein Passwort? Bitte kontaktieren Sie den Administrator.
        </p>
      </div>
    </LoginSplitLayout>
  )
}

