"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Ungültiger Reset-Token")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!token) {
      setError("Ungültiger Reset-Token")
      return
    }

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein")
      return
    }

    setLoading(true)

    try {
      console.log("Sending password reset for token:", token?.substring(0, 20) + "...")
      const response = await fetch("/api/auth/reseeasy-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      console.log("Response status:", response.status, response.statusText)
      const data = await response.json()
      console.log("Reset password response:", { status: response.status, data })

      if (response.ok && data.success !== false) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/login?reset=success")
        }, 2000)
      } else {
        setError(data.message || data.error || "Ein Fehler ist aufgetreten")
      }
    } catch (err) {
      console.error("Reset password error:", err)
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
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
          padding: "clamp(1.5rem, 4vw, 2rem)",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          textAlign: "center"
        }}>
          <div style={{ marginBottom: "1rem", fontSize: "3rem" }}>❌</div>
          <h1 style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: "700",
            color: "#24c598",
            marginBottom: "0.5rem"
          }}>
            Ungültiger Reset-Link
          </h1>
          <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)", marginBottom: "1.5rem" }}>
            Der Reset-Link ist ungültig oder abgelaufen.
          </p>
          <Link
            href="/forgoeasy-password"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "0.9rem"
            }}
          >
            Neuen Reset-Link anfordern
          </Link>
        </div>
      </div>
    )
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
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "1rem", fontSize: "3rem" }}>✅</div>
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#00A651",
              marginBottom: "0.5rem"
            }}>
              Passwort zurückgesetzt!
            </h1>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)" }}>
              Sie werden zum Login weitergeleitet...
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 style={{
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: "700",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Neues Passwort festlegen
              </h1>
            </div>

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
                  Neues Passwort
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
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#7A7A7A",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      padding: "0.25rem 0.5rem"
                    }}
                  >
                    {showPassword ? "Verbergen" : "Anzeigen"}
                  </button>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#7A7A7A", marginTop: "0.25rem" }}>
                  Mindestens 8 Zeichen
                </p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#0A0A0A",
                  fontWeight: "500",
                  fontSize: "0.9rem"
                }}>
                  Passwort bestätigen
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
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
                {loading ? "Wird gespeichert..." : "Passwort zurücksetzen"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Lade...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}

