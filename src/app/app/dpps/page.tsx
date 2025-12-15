export const dynamic = "force-dynamic"

import DppCard from "@/components/DppCard"
import Link from "next/link"
import AuthGate from "../_auth/AuthGate"

async function DppsContent() {
  // Lade DPPs via API
  let dpps: Array<{
    id: string
    name: string
    description: string | null
    organizationName: string
    mediaCount: number
    status: string
    updatedAt: string
    latestVersion: {
      version: number
      createdAt: string
      createdBy: string
      hasQrCode: boolean
    } | null
  }> = []

  try {
    const response = await fetch("/api/app/dpps", {
      cache: "no-store",
    })
    if (response.ok) {
      const data = await response.json()
      dpps = data.dpps || []
    }
  } catch (error) {
    console.error("Error loading DPPs:", error)
  }

  return (
    <div>
      <div style={{
        marginBottom: "1rem"
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
      </div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Produktpässe verwalten
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Verwalten Sie alle Ihre Digital Product Passports an einem Ort.
      </p>

      {dpps.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem"
        }}>
          {dpps.map((dpp) => (
            <DppCard
              key={dpp.id}
              id={dpp.id}
              name={dpp.name}
              description={dpp.description}
              organizationName={dpp.organizationName}
              mediaCount={dpp.mediaCount}
              status={dpp.status}
              updatedAt={new Date(dpp.updatedAt)}
              latestVersion={dpp.latestVersion ? {
                ...dpp.latestVersion,
                createdAt: new Date(dpp.latestVersion.createdAt)
              } : null}
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
            Noch keine Produktpässe erstellt.
          </p>
          <a
            href="/app/dpps/new"
            style={{
              display: "inline-block",
              backgroundColor: "#E20074",
              color: "#FFFFFF",
              padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
            }}
          >
            Ersten Produktpass erstellen
          </a>
        </div>
      )}
    </div>
  )
}

export default async function DppsPage() {
  return (
    <AuthGate>
      <DppsContent />
    </AuthGate>
  )
}

