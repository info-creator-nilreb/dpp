"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Kein Verifizierungs-Token gefunden")
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage("Ihre E-Mail-Adresse wurde erfolgreich verifiziert!")
          // Nach 2 Sekunden zum Login weiterleiten
          setTimeout(() => {
            router.push("/login?verified=true")
          }, 2000)
        } else {
          if (data.error === "TOKEN_EXPIRED") {
            setStatus("expired")
            setMessage("Der Verifizierungs-Link ist abgelaufen. Bitte registrieren Sie sich erneut.")
          } else {
            setStatus("error")
            setMessage(data.error || "Fehler bei der Verifizierung")
          }
        }
      } catch (err) {
        setStatus("error")
        setMessage("Ein Fehler ist aufgetreten")
      }
    }

    verifyEmail()
  }, [token, router])

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
        {status === "loading" && (
          <>
            <div style={{ marginBottom: "1rem", fontSize: "3rem" }}>⏳</div>
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              E-Mail wird verifiziert...
            </h1>
          </>
        )}
        
        {status === "success" && (
          <>
            <div style={{ marginBottom: "1rem", fontSize: "3rem" }}>✅</div>
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#00A651",
              marginBottom: "0.5rem"
            }}>
              E-Mail verifiziert!
            </h1>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)", marginBottom: "1.5rem" }}>
              {message}
            </p>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>
              Sie werden zum Login weitergeleitet...
            </p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div style={{ marginBottom: "1rem", fontSize: "3rem" }}>❌</div>
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#E20074",
              marginBottom: "0.5rem"
            }}>
              Fehler
            </h1>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)", marginBottom: "1.5rem" }}>
              {message}
            </p>
            <Link
              href="/signup"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#E20074",
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "0.9rem"
              }}
            >
              Zur Registrierung
            </Link>
          </>
        )}
        
        {status === "expired" && (
          <>
            <div style={{ marginBottom: "1rem", fontSize: "3rem" }}>⏰</div>
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#E20074",
              marginBottom: "0.5rem"
            }}>
              Link abgelaufen
            </h1>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)", marginBottom: "1.5rem" }}>
              {message}
            </p>
            <Link
              href="/signup"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#E20074",
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "0.9rem"
              }}
            >
              Erneut registrieren
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

