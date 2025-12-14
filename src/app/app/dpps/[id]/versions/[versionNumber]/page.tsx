export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { requireDppAccess } from "@/lib/dpp-access"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import DppViewer from "@/components/DppViewer"
import VersionQrCodeSection from "@/components/VersionQrCodeSection"

/**
 * Versionen-Ansicht (Read-only)
 * 
 * Zeigt eine veröffentlichte Version eines DPPs (unveränderlich)
 */
export default async function VersionViewPage({
  params,
}: {
  params: { id: string; versionNumber: string }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Prüfe Zugriff auf DPP
  await requireDppAccess(params.id)

  const versionNumber = parseInt(params.versionNumber, 10)
  if (isNaN(versionNumber)) {
    redirect(`/app/dpps/${params.id}/versions`)
  }

  // Lade Version
  const version = await prisma.dppVersion.findUnique({
    where: {
      dppId_version: {
        dppId: params.id,
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
          name: true
        }
      }
    }
  })

  if (!version) {
    redirect(`/app/dpps/${params.id}/versions`)
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
        <span style={{ color: "#CDCDCD" }}>|</span>
        <Link
          href={`/app/dpps/${params.id}/versions`}
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
        border: "1px solid #E20074",
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
            color: "#E20074"
          }}>
            Veröffentlichte Version (Read-only)
          </span>
        </div>
        <div style={{
          fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
          color: "#7A7A7A"
        }}>
          Diese Version wurde am {formatDate(version.createdAt)} von {version.createdBy.name || version.createdBy.email} veröffentlicht und kann nicht mehr geändert werden.
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
        Veröffentlicht am {formatDate(version.createdAt)} von {version.createdBy.name || version.createdBy.email}
      </p>

      {/* Public URL & QR-Code */}
      <VersionQrCodeSection
        publicUrl={version.publicUrl}
        qrCodeImageUrl={version.qrCodeImageUrl}
        dppId={params.id}
        version={version.version}
      />

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
  )
}

