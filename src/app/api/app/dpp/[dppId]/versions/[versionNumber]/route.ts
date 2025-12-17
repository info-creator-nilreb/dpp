export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getPublicUrl } from "@/lib/getPublicUrl"

/**
 * GET /api/app/dpp/[dppId]/versions/[versionNumber]
 * 
 * Holt Details einer spezifischen Version (read-only)
 */
export async function GET(
  request: Request,
  { params }: { params: { dppId: string; versionNumber: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Zugriff auf DPP
    const accessCheck = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!accessCheck || accessCheck.organization.memberships.length === 0) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diesen DPP" },
        { status: 403 }
      )
    }

    const versionNumber = parseInt(params.versionNumber, 10)
    if (isNaN(versionNumber)) {
      return NextResponse.json(
        { error: "Ungültige Versionsnummer" },
        { status: 400 }
      )
    }

    // Hole spezifische Version
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
        }
      }
    })

    if (!version) {
      return NextResponse.json(
        { error: "Version nicht gefunden" },
        { status: 404 }
      )
    }

    // Generiere absolute URL zur Laufzeit (unterstützt auch bestehende absolute URLs)
    const absolutePublicUrl = getPublicUrl(version.publicUrl)

    return NextResponse.json({
      version: {
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
        secondLifeInfo: version.secondLifeInfo,
        createdAt: version.createdAt.toISOString(),
        createdBy: {
          name: version.createdBy.name || version.createdBy.email,
          email: version.createdBy.email
        },
        publicUrl: absolutePublicUrl, // Absolute URL für Client
        qrCodeImageUrl: version.qrCodeImageUrl,
        dppName: accessCheck.name
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching version:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

