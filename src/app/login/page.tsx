"use client"

export const dynamic = "force-dynamic"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { LoginSplitLayout } from "@/components/LoginSplitLayout"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [totpCode, setTotpCode] = useState("")
  
  // Lese callbackUrl aus Query-Parametern (falls vorhanden)
  const callbackUrl = searchParams.get("callbackUrl") || "/app/dashboard"

  const performLogin = async () => {
    if (loading) {
      return
    }
    
    setError("")
    setLoading(true)

    try {
      // STEP 1: Wenn noch kein 2FA-Code eingegeben wurde, prüfe zuerst das Passwort
      if (!requires2FA && !totpCode) {
        try {
          // Passwort zuerst prüfen - gibt zurück, ob 2FA erforderlich ist
          const verifyResponse = await fetch("/api/auth/verify-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          })

          const verifyData = await verifyResponse.json()

          if (!verifyResponse.ok) {
            // Passwort falsch oder anderer Fehler
            setError(verifyData.error || "Ungültige E-Mail oder Passwort")
            setLoading(false)
            return
          }

          // Passwort ist korrekt - prüfe ob 2FA erforderlich ist
          if (verifyData.requires2FA) {
            setRequires2FA(true)
            setLoading(false)
            return // Zeige 2FA-Feld an
          }

          // Passwort korrekt, kein 2FA erforderlich - direkt einloggen
          // Fall durch zum normalen Login-Flow weiter unten
        } catch (verifyError) {
          console.error("Error verifying password:", verifyError)
          setError("Ein Fehler ist aufgetreten")
          setLoading(false)
          return
        }
      }

      // STEP 2: Login durchführen (entweder ohne 2FA oder mit 2FA-Code)
      const signInOptions: any = {
        email,
        password,
        redirect: false,
        callbackUrl: callbackUrl
      }
      
      // Nur totpCode hinzufügen, wenn 2FA erforderlich ist und ein Code vorhanden ist
      if (requires2FA && totpCode) {
        signInOptions.totpCode = totpCode.trim()
      }
      
      const result: any = await signIn("credentials", signInOptions)

      // Prüfe auf Fehler
      if (result?.error) {
        // Prüfe ob User existiert aber nicht verifiziert ist
        if (result?.error === "CredentialsSignin") {
          try {
            const checkVerificationResponse = await fetch(`/api/auth/check-verification?email=${encodeURIComponent(email)}`)
            if (checkVerificationResponse.ok) {
              const checkData = await checkVerificationResponse.json()
              if (!checkData.emailVerified) {
                setError("Bitte verifizieren Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden. Prüfen Sie Ihr Postfach.")
                setLoading(false)
                return
              }
            }
          } catch (checkError) {
            // Fehler ignorieren
          }
        }
        
        // Fehlermeldung anzeigen
        if (requires2FA && totpCode) {
          setError("Ungültiger 2FA-Code. Bitte versuchen Sie es erneut.")
        } else {
          setError("Ungültige E-Mail oder Passwort")
        }
        setLoading(false)
      } else {
        // Login erfolgreich - leite zu callbackUrl weiter (oder Dashboard als Fallback)
        window.location.href = callbackUrl
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError("Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    await performLogin()
  }

  return (
    <LoginSplitLayout
      title="Hallo!"
      subtitle="Willkommen zurück."
      quote={{
        text: "Produktivität ist weniger das, was du tust, sondern mehr das, was du vollendest.",
        author: "David Allen"
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
            stroke="#E20074"
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
          T-Pass
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
            Willkommen zurück
          </h1>
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
              E-Mail
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                  color: "#E20074"
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

          {requires2FA && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#0A0A0A",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}>
                2FA-Code (Authenticator)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required={requires2FA}
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #CDCDCD",
                  borderRadius: "6px",
                  fontSize: "1.5rem",
                  boxSizing: "border-box",
                  textAlign: "center",
                  letterSpacing: "0.5rem",
                  fontFamily: "monospace"
                }}
                autoFocus
              />
              <p style={{ fontSize: "0.8rem", color: "#7A7A7A", marginTop: "0.25rem", textAlign: "center" }}>
                Geben Sie den 6-stelligen Code aus Ihrem Authenticator-App ein
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              performLogin()
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: loading ? "#CDCDCD" : "#E20074",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "1rem"
            }}
          >
            {loading ? "Wird geladen..." : "Anmelden"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <Link
            href="/forgot-password"
            style={{
              color: "#E20074",
              textDecoration: "none",
              fontSize: "0.9rem"
            }}
          >
            Passwort vergessen?
          </Link>
        </div>

        <p style={{ textAlign: "center", color: "#7A7A7A", fontSize: "0.9rem" }}>
          Neu hier?{" "}
          <Link href="/signup" style={{ color: "#E20074", textDecoration: "none", fontWeight: "500" }}>
            Jetzt registrieren →
          </Link>
        </p>
      </div>
    </LoginSplitLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <LoginSplitLayout>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#7A7A7A" }}>Wird geladen...</p>
        </div>
      </LoginSplitLayout>
    }>
      <LoginForm />
    </Suspense>
  )
}
