export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/dpps
 * 
 * Gets all DPPs for the current user's organizations with version info
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id
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
                  take: 1,
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

    const dpps = memberships.flatMap(m => 
      m.organization.dpps.map(dpp => ({
        id: dpp.id,
        name: dpp.name,
        description: dpp.description,
        organizationName: m.organization.name,
        mediaCount: dpp.media.length,
        status: dpp.status || "DRAFT",
        updatedAt: dpp.updatedAt.toISOString(),
        latestVersion: dpp.versions.length > 0 ? {
          version: dpp.versions[0].version,
          createdAt: dpp.versions[0].createdAt.toISOString(),
          createdBy: dpp.versions[0].createdBy.name || dpp.versions[0].createdBy.email,
          hasQrCode: !!dpp.versions[0].qrCodeImageUrl
        } : null
      }))
    )

    console.log("DPP LIST COUNT", dpps.length)

    return NextResponse.json({ dpps }, { status: 200 })
  } catch (error) {
    console.error("Error fetching DPPs:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

