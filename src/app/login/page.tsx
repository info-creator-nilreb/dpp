"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError("Ungültige E-Mail oder Passwort")
      } else {
        router.push("/app/dashboard")
        router.refresh()
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
        border: "1px solid #CDCDCD"
      }}>
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "1rem" }}>
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                style={{ width: "100%", height: "100%" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span style={{ fontSize: "0.9rem", color: "#7A7A7A" }}>Zur Startseite</span>
          </Link>
          <h1 style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Anmelden
          </h1>
          <p style={{ color: "#7A7A7A", fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>
            Melden Sie sich bei Ihrem Konto an
          </p>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <p style={{ textAlign: "center", color: "#7A7A7A", fontSize: "0.9rem" }}>
          Noch kein Konto?{" "}
          <Link href="/signup" style={{ color: "#E20074", textDecoration: "none", fontWeight: "500" }}>
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}

