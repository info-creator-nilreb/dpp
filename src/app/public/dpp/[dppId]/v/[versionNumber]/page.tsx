import { prisma } from "@/lib/prisma"
import DppViewer from "@/components/DppViewer"
import { notFound } from "next/navigation"

/**
 * Öffentliche Ansicht einer DPP-Version
 * 
 * Read-only Ansicht ohne Authentifizierung
 * Zugriff über QR-Code oder direkte URL
 */
export default async function PublicVersionPage({
  params,
}: {
  params: { dppId: string; versionNumber: string }
}) {
  const versionNumber = parseInt(params.versionNumber, 10)
  if (isNaN(versionNumber)) {
    notFound()
  }

  // Lade Version (öffentlich, keine Auth-Prüfung)
  const version = await prisma.dppVersion.findUnique({
    where: {
      dppId_version: {
        dppId: params.dppId,
        version: versionNumber
      }
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      dpp: {
        select: {
          id: true,
          name: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  if (!version) {
    notFound()
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
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F5", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(1.5rem, 4vw, 2rem)",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
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
              color: "#E20074"
            }}>
              Veröffentlichte Version (Read-only)
            </span>
          </div>
          <div style={{
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            color: "#7A7A7A"
          }}>
            Diese Version wurde am {formatDate(version.createdAt)} von {version.createdBy.name || version.createdBy.email} veröffentlicht.
          </div>
        </div>

        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {version.dpp.name} • Version {version.version}
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
          marginBottom: "2rem"
        }}>
          {version.dpp.organization.name} • Veröffentlicht am {formatDate(version.createdAt)}
        </p>

        <DppViewer version={{
          id: version.id,
          version: version.version,
          name: version.name,
          description: version.description,
          category: version.category,
          sku: version.sku,
          gtin: version.gtin,
          brand: version.brand,
          countryOfOrigin: version.countryOfOrigin,
          materials: version.materials,
          materialSource: version.materialSource,
          careInstructions: version.careInstructions,
          isRepairable: version.isRepairable,
          sparePartsAvailable: version.sparePartsAvailable,
          lifespan: version.lifespan,
          conformityDeclaration: version.conformityDeclaration,
          disposalInfo: version.disposalInfo,
          takebackOffered: version.takebackOffered,
          takebackContact: version.takebackContact,
          secondLifeInfo: version.secondLifeInfo
        }} />
      </div>
    </div>
  )
}

