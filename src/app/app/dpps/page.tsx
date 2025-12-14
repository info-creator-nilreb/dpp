import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserOrganizations } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import DppCard from "@/components/DppCard"
import Link from "next/link"

/**
 * Produktpässe verwalten
 * 
 * Übersichtsliste aller DPPs
 */
export default async function DppsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Lade Organizations des Users
  const organizations = await getUserOrganizations()

  // Lade DPPs der Organizations des Users mit Versionen-Info
  const memberships = await prisma.membership.findMany({
    where: {
      userId: session.user.id!
    },
    include: {
      organization: {
        include: {
          dpps: {
            include: {
              media: {
                select: {
                  id: true
                }
              },
              versions: {
                orderBy: {
                  version: "desc"
                },
                take: 1, // Nur neueste Version für Übersicht
                include: {
                  createdBy: {
                    select: {
                      name: true,
                      email: true
                    }
                  }
                }
              }
            },
            orderBy: {
              updatedAt: "desc"
            }
          }
        }
      }
    }
  })

  // Sammle alle DPPs mit Versions-Info
  const dpps = memberships.flatMap(m => 
    m.organization.dpps.map(dpp => ({
      id: dpp.id,
      name: dpp.name,
      description: dpp.description,
      organizationName: m.organization.name,
      mediaCount: dpp.media.length,
      status: dpp.status || "DRAFT",
      updatedAt: dpp.updatedAt,
      latestVersion: dpp.versions.length > 0 ? {
        version: dpp.versions[0].version,
        createdAt: dpp.versions[0].createdAt,
        createdBy: dpp.versions[0].createdBy.name || dpp.versions[0].createdBy.email,
        hasQrCode: !!dpp.versions[0].qrCodeImageUrl
      } : null
    }))
  )

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
              updatedAt={dpp.updatedAt}
              latestVersion={dpp.latestVersion}
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

