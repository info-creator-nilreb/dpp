export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { requireDppAccess } from "@/lib/dpp-access"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import VersionCard from "@/components/VersionCard"
import VersionLink from "@/components/VersionLink"

/**
 * Versionen-Liste
 * 
 * Zeigt alle veröffentlichten Versionen eines DPPs
 */
export default async function VersionsPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Prüfe Zugriff auf DPP
  await requireDppAccess(params.id)

  // Lade DPP mit Versionen
  const dpp = await prisma.dpp.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      status: true,
      versions: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          version: "desc"
        }
      }
    }
  })

  if (!dpp) {
    redirect("/app/dpps")
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
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
              href={`/app/dpps/${params.id}/versions/${version.version}`}
              version={version.version}
              createdAt={version.createdAt}
              createdBy={version.createdBy.name || version.createdBy.email}
              hasQrCode={!!version.qrCodeImageUrl}
              dppId={params.id}
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
            href={`/app/dpps/${params.id}`}
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
            Erste Version veröffentlichen
          </Link>
        </div>
      )}
    </div>
  )
}

