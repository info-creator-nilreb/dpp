"use client"

export const dynamic = "force-dynamic"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

// Passwortstärke berechnen
function calculatePasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong" | "very-strong"
  score: number
  feedback: string
} {
  if (!password) {
    return { strength: "weak", score: 0, feedback: "" }
  }

  let score = 0
  const feedback: string[] = []

  // Länge
  if (password.length >= 8) score += 1
  else feedback.push("Mindestens 8 Zeichen")
  
  if (password.length >= 12) score += 1

  // Großbuchstaben
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push("Großbuchstaben verwenden")

  // Kleinbuchstaben
  if (/[a-z]/.test(password)) score += 1
  else feedback.push("Kleinbuchstaben verwenden")

  // Zahlen
  if (/\d/.test(password)) score += 1
  else feedback.push("Zahlen verwenden")

  // Sonderzeichen
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  else feedback.push("Sonderzeichen verwenden")

  let strength: "weak" | "medium" | "strong" | "very-strong"
  let feedbackText = ""

  if (score <= 2) {
    strength = "weak"
    feedbackText = "Schwach"
  } else if (score <= 4) {
    strength = "medium"
    feedbackText = "Mittel"
  } else if (score <= 5) {
    strength = "strong"
    feedbackText = "Stark"
  } else {
    strength = "very-strong"
    feedbackText = "Sehr stark"
  }

  return { strength, score, feedback: feedbackText }
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password])

  // Prüfe ob Erfolgs-Nachricht angezeigt werden soll
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccessMessage(true)
      const emailParam = searchParams.get("email")
      if (emailParam) {
        setRegisteredEmail(emailParam)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten")
      } else {
        // Nach Registrierung zur Info-Seite weiterleiten, die den User auf Verifizierung hinweist
        router.push("/signup?success=true&email=" + encodeURIComponent(email))
      }
    } catch (err) {
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
            Jetzt kostenlos registrieren
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {showSuccessMessage && (
            <div style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#E8F5E9",
              border: "1px solid #C8E6C9",
              borderRadius: "6px",
              color: "#2E7D32",
              fontSize: "0.9rem"
            }}>
              <strong>Registrierung erfolgreich!</strong>
              <p style={{ margin: "0.5rem 0 0 0" }}>
                Bitte prüfen Sie Ihr E-Mail-Postfach ({registeredEmail}) und klicken Sie auf den Verifizierungs-Link, um Ihr Konto zu aktivieren.
              </p>
            </div>
          )}
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
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
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
            {/* Passwortstärke-Anzeige */}
            {password && (
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{
                  display: "flex",
                  gap: "0.25rem",
                  marginBottom: "0.25rem"
                }}>
                  {[1, 2, 3, 4].map((level) => {
                    const isActive = passwordStrength.score >= level
                    let bgColor = "#CDCDCD"
                    if (isActive) {
                      if (passwordStrength.strength === "weak") bgColor = "#E20074"
                      else if (passwordStrength.strength === "medium") bgColor = "#FFA500"
                      else if (passwordStrength.strength === "strong") bgColor = "#FFD700"
                      else bgColor = "#00A651"
                    }
                    return (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: "4px",
                          backgroundColor: bgColor,
                          borderRadius: "2px"
                        }}
                      />
                    )
                  })}
                </div>
                <span style={{
                  fontSize: "0.85rem",
                  color: passwordStrength.strength === "weak" ? "#E20074" :
                         passwordStrength.strength === "medium" ? "#FFA500" :
                         passwordStrength.strength === "strong" ? "#FFD700" : "#00A651",
                  fontWeight: "500"
                }}>
                  {passwordStrength.feedback}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
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
            {loading ? "Wird erstellt..." : "Konto erstellen"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#7A7A7A", fontSize: "0.9rem" }}>
          Bereits ein Konto?{" "}
          <Link href="/login" style={{ color: "#E20074", textDecoration: "none", fontWeight: "500" }}>
            Jetzt anmelden →
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F5F5",
        padding: "1rem"
      }}>
        <div style={{ color: "#7A7A7A" }}>Lade...</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}

