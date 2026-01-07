export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/dpps
 * 
 * Gets paginated, filtered, and searchable DPPs for the current user's organizations
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 12, max: 100)
 * - search: Search query (searches in name and description)
 * - status: Filter by status (DRAFT, PUBLISHED)
 * - category: Filter by category (TEXTILE, FURNITURE, OTHER)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)))
    const search = searchParams.get("search")?.trim() || ""
    const status = searchParams.get("status")?.trim() || ""
    const category = searchParams.get("category")?.trim() || ""

    // Get user's organization IDs
    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        organizationId: true
      }
    })

    const organizationIds = memberships.map(m => m.organizationId)

    if (organizationIds.length === 0) {
      return NextResponse.json({
        dpps: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      }, { status: 200 })
    }

    // Build WHERE clause for filtering
    const where: any = {
      organizationId: {
        in: organizationIds
      }
    }

    // Add search filter (searches in name and description)
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          description: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          sku: {
            contains: search,
            mode: "insensitive"
          }
        }
      ]
    }

    // Add status filter
    if (status && (status === "DRAFT" || status === "PUBLISHED")) {
      where.status = status
    }

    // Add category filter
    if (category && (category === "TEXTILE" || category === "FURNITURE" || category === "OTHER")) {
      where.category = category
    }

    // Get total count for pagination
    const total = await prisma.dpp.count({ where })

    // Get paginated DPPs with relations
    const dpps = await prisma.dpp.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        organization: {
          select: {
            name: true
          }
        },
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
      }
    })

    // Transform to API response format
    const transformedDpps = dpps.map(dpp => ({
      id: dpp.id,
      name: dpp.name,
      description: dpp.description,
      category: dpp.category,
      organizationName: dpp.organization.name,
      mediaCount: dpp.media.length,
      status: dpp.status || "DRAFT",
      updatedAt: dpp.updatedAt.toISOString(),
      latestVersion: dpp.versions.length > 0 ? {
        version: dpp.versions[0].version,
        createdAt: dpp.versions[0].createdAt.toISOString(),
        createdBy: dpp.versions[0].createdBy.name || dpp.versions[0].createdBy.email,
        hasQrCode: !!dpp.versions[0].publicUrl
      } : null
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      dpps: transformedDpps,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }, { status: 200 })
  } catch (error: any) {
    // Connection Pool Overflow oder andere DB-Fehler abfangen
    if (
      error?.message?.includes("MaxClientsInSessionMode") ||
      error?.message?.includes("max clients reached") ||
      error?.code === "P1001"
    ) {
      return NextResponse.json({
        dpps: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        error: "Datenbankverbindung überlastet. Bitte versuchen Sie es später erneut.",
      }, { status: 503 })
    }
    
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

