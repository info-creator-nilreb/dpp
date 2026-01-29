"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { LoginSplitLayout } from "@/components/LoginSplitLayout"

// Loading Spinner Komponente
function LoadingSpinner() {
  return (
    <div style={{
      width: "64px",
      height: "64px",
      margin: "0 auto 1.5rem",
      position: "relative"
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <svg
        className="spinner"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#24c598"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="32"
          opacity="0.3"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#24c598"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="24"
        />
      </svg>
    </div>
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "verifying" | "success" | "error" | "expired">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Kein Verifizierungs-Token gefunden")
      return
    }

    // Zeige "wird geprüft" Status nach kurzer Verzögerung
    const showVerifyingTimeout = setTimeout(() => {
      setStatus("verifying")
    }, 500)

    const verifyEmail = async () => {
      try {
        // Simuliere eine kleine Verzögerung für bessere UX
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage("Ihre E-Mail-Adresse wurde erfolgreich verifiziert!")
          // Nach 3 Sekunden zum Login weiterleiten
          setTimeout(() => {
            router.push("/login?verified=true")
          }, 3000)
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
      } finally {
        clearTimeout(showVerifyingTimeout)
      }
    }

    verifyEmail()

    return () => {
      clearTimeout(showVerifyingTimeout)
    }
  }, [token, router])

  return (
    <LoginSplitLayout
      title="E-Mail-Verifizierung"
      subtitle="Ihre Registrierung wird geprüft"
      quote={{
        text: "Vertrauen beginnt mit Verifizierung.",
        author: "Easy Pass"
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
        textAlign: "center"
      }}>
        {status === "loading" && (
          <>
            <LoadingSpinner />
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Registrierung wird geladen...
            </h1>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)" }}>
              Bitte warten Sie einen Moment
            </p>
          </>
        )}

        {status === "verifying" && (
          <>
            <LoadingSpinner />
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Registrierung wird geprüft
            </h1>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)", marginBottom: "0.5rem" }}>
              Ihre E-Mail-Adresse wird gerade verifiziert...
            </p>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>
              Dies kann einen Moment dauern
            </p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div style={{ marginBottom: "1.5rem" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ margin: "0 auto" }}
              >
                <circle cx="12" cy="12" r="10" fill="#00A651" />
                <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#00A651",
              marginBottom: "0.5rem"
            }}>
              Verifizierung erfolgreich!
            </h1>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)", marginBottom: "1rem" }}>
              {message}
            </p>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>
              Sie werden in Kürze zum Login weitergeleitet...
            </p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div style={{ marginBottom: "1.5rem" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ margin: "0 auto" }}
              >
                <circle cx="12" cy="12" r="10" fill="#24c598" />
                <path d="M9 9l6 6M15 9l-6 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#24c598",
              marginBottom: "0.5rem"
            }}>
              Fehler bei der Verifizierung
            </h1>
            <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)", marginBottom: "1.5rem" }}>
              {message}
            </p>
            <Link
              href="/signup"
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
              Zur Registrierung
            </Link>
          </>
        )}
        
        {status === "expired" && (
          <>
            <div style={{ marginBottom: "1.5rem" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ margin: "0 auto" }}
              >
                <circle cx="12" cy="12" r="10" fill="#24c598" />
                <circle cx="12" cy="12" r="1" fill="#FFFFFF" />
                <path d="M12 6v6l4 2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#24c598",
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
                backgroundColor: "#24c598",
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
    </LoginSplitLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <LoginSplitLayout
        title="E-Mail-Verifizierung"
        subtitle="Ihre Registrierung wird geprüft"
        quote={{
          text: "Vertrauen beginnt mit Verifizierung.",
          author: "Easy Pass"
        }}
      >
        <div style={{
          width: "100%",
          padding: "clamp(1.5rem, 4vw, 2rem)",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          boxSizing: "border-box",
          textAlign: "center"
        }}>
          <LoadingSpinner />
          <h1 style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Lade...
          </h1>
        </div>
      </LoginSplitLayout>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

