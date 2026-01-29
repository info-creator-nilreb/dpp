"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import VersionCard from "@/components/VersionCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface VersionsContentProps {
  id: string
}

export default function VersionsContent({ id }: VersionsContentProps) {
  const router = useRouter()
  const [dpp, setDpp] = useState<{
    id: string
    name: string
    status: string
    versions: Array<{
      id: string
      version: number
      createdAt: string
      createdBy: { name: string | null; email: string }
      hasQrCode: boolean
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVersions() {
      try {
        console.log("VERSIONS: Loading versions for DPP id:", id)
        const versionsResponse = await fetch(`/api/app/dpp/${id}/versions`, {
          cache: "no-store",
        })
        
        console.log("VERSIONS: Response status:", versionsResponse.status)
        
        if (!versionsResponse.ok) {
          if (versionsResponse.status === 404 || versionsResponse.status === 403) {
            console.error("VERSIONS: Access denied or not found, redirecting")
            router.replace("/app/dpps")
            return
          }
          let errorMessage = "Fehler beim Laden der Versionen"
          try {
            const errorData = await versionsResponse.json()
            console.error("VERSIONS: Error loading versions:", errorData)
            errorMessage = errorData.error || errorMessage
          } catch (parseError) {
            console.error("VERSIONS: Could not parse error response:", parseError)
            errorMessage = `HTTP ${versionsResponse.status}: ${versionsResponse.statusText}`
          }
          setError(errorMessage)
          setLoading(false)
          return
        }
        
        const data = await versionsResponse.json()
        console.log("VERSIONS: Versions loaded successfully:", data.versions?.length || 0, "versions")
        
        const versions = data.versions || []
        if (data.dpp) {
          setDpp({
            id: id,
            name: data.dpp.name,
            status: data.dpp.status || "DRAFT",
            versions: versions
          })
        } else {
          setError("DPP nicht gefunden")
        }
        setLoading(false)
      } catch (error) {
        console.error("VERSIONS: Error loading versions:", error)
        setError("Fehler beim Laden der Versionen")
        setLoading(false)
      }
    }
    
    loadVersions()
  }, [id, router])

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
        <LoadingSpinner message="Lade Versionen..." />
      </div>
    )
  }

  if (error || !dpp) {
    return (
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
          {error || "Versionen nicht gefunden"}
        </p>
        <a
          href="/app/dpps"
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
          Zurück zur Übersicht
        </a>
      </div>
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
      </div>

      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        Versionen: {dpp.name}
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Alle veröffentlichten Versionen dieses Produktpasses
      </p>

      {dpp.versions.length > 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          {dpp.versions.map((version) => (
            <VersionCard
              key={version.id}
              href={`/app/dpps/${id}/versions/${version.version}`}
              version={version.version}
              createdAt={version.createdAt}
              createdBy={version.createdBy.name || version.createdBy.email}
              hasQrCode={version.hasQrCode}
              dppId={id}
            />
          ))}
        </div>
      ) : (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(2rem, 5vw, 4rem)",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          textAlign: "center"
        }}>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: "1.5rem"
          }}>
            Noch keine Versionen veröffentlicht.
          </p>
          <Link
            href={`/app/dpps/${id}`}
            style={{
              display: "inline-block",
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
            }}
          >
            Erste Version veröffentlichen
          </Link>
        </div>
      )}
    </div>
  )
}

