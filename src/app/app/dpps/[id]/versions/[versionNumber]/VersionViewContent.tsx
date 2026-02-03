"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import VersionQrCodeSection from "@/components/VersionQrCodeSection"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface VersionViewContentProps {
  id: string
  versionNumber: string
}

export default function VersionViewContent({ id, versionNumber }: VersionViewContentProps) {
  const router = useRouter()
  const [version, setVersion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVersion() {
      const versionNum = parseInt(versionNumber, 10)
      if (isNaN(versionNum)) {
        router.replace(`/app/dpps/${id}/versions`)
        return
      }

      try {
        console.log("VERSION VIEW: Loading version", versionNum, "for DPP id:", id)
        const versionResponse = await fetch(`/api/app/dpp/${id}/versions/${versionNum}`, {
          cache: "no-store",
        })
        
        console.log("VERSION VIEW: Response status:", versionResponse.status)
        
        if (!versionResponse.ok) {
          if (versionResponse.status === 404 || versionResponse.status === 403) {
            console.error("VERSION VIEW: Access denied or not found, redirecting")
            router.replace(`/app/dpps/${id}/versions`)
            return
          }
          const errorData = await versionResponse.json()
          console.error("VERSION VIEW: Error loading version:", errorData)
          setError(errorData.error || "Fehler beim Laden der Version")
          setLoading(false)
          return
        }
        
        const data = await versionResponse.json()
        console.log("VERSION VIEW: Version loaded successfully:", data.version?.version)
        setVersion(data.version)
        setLoading(false)
      } catch (error) {
        console.error("VERSION VIEW: Error loading version:", error)
        setError("Fehler beim Laden der Version")
        setLoading(false)
      }
    }
    
    loadVersion()
  }, [id, versionNumber, router])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <LoadingSpinner message="Lade Version..." />
      </div>
    )
  }

  if (error || !version) {
    return (
      <>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap"
        }}>
          <Link
            href="/app/dashboard"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "clamp(0.9rem, 2vw, 1rem)"
            }}
          >
            ← Zum Dashboard
          </Link>
          <span style={{ color: "#CDCDCD" }}>|</span>
          <Link
            href="/app/dpps"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "clamp(0.9rem, 2vw, 1rem)"
            }}
          >
            Zur Übersicht
          </Link>
          <span style={{ color: "#CDCDCD" }}>|</span>
          <Link
            href={`/app/dpps/${id}/versions`}
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "clamp(0.9rem, 2vw, 1rem)"
            }}
          >
            Versionen
          </Link>
        </div>
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(2rem, 5vw, 4rem)",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          textAlign: "center"
        }}>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            marginBottom: "1rem"
          }}>
            {error || "Version nicht gefunden"}
          </p>
        <a
          href={`/app/dpps/${id}/versions`}
          style={{
            display: "inline-block",
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)"
          }}
        >
          Zurück zu Versionen
        </a>
      </div>
      </>
    )
  }

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1rem",
        flexWrap: "wrap"
      }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zum Dashboard
        </Link>
        <span style={{ color: "#CDCDCD" }}>|</span>
        <Link
          href="/app/dpps"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          Zur Übersicht
        </Link>
        <span style={{ color: "#CDCDCD" }}>|</span>
        <Link
          href={`/app/dpps/${id}/versions`}
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          Zu Versionen
        </Link>
      </div>

      <div style={{
        backgroundColor: "#FFF5F9",
        border: "1px solid #24c598",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem"
        }}>
          <span style={{
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            fontWeight: "600",
            color: "#24c598"
          }}>
            Veröffentlichte Version (Read-only)
          </span>
        </div>
        <div style={{
          fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
          color: "#7A7A7A"
        }}>
          Diese Version wurde am {formatDate(new Date(version.createdAt))} von {version.createdBy.name || version.createdBy.email} veröffentlicht und kann nicht mehr geändert werden.
        </div>
      </div>

      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {version.dppName} • Version {version.version}
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Veröffentlicht am {formatDate(new Date(version.createdAt))} von {version.createdBy.name || version.createdBy.email}
      </p>

      {/* Öffentlicher Zugriff: URL, QR-Code, Download, Public-View-Button (Pflichtdaten-Vorschau entfällt – gibt es im Editor) */}
      <VersionQrCodeSection
        publicUrl={version.publicUrl}
        qrCodeImageUrl={version.qrCodeImageUrl}
        dppId={id}
        version={version.version}
      />
    </div>
  )
}

