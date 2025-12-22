/**
 * SUPER ADMIN DPP SUGGESTIONS API
 * 
 * Provides autocomplete suggestions for DPP search
 * Returns max 5-8 suggestions from DPP name and brand
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Check super admin permission
    const session = await requireSuperAdminPermissionApiThrow("organization", "read")
    
    // If session is a NextResponse (error response), return it
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim() || ""

    // Return empty if query is too short
    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Search in name and brand, limit to 8 results
    const dpps = await prisma.dpp.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            brand: {
              contains: query,
              mode: "insensitive"
            }
          }
        ]
      },
      select: {
        name: true,
        brand: true
      },
      take: 8,
      orderBy: {
        updatedAt: "desc"
      }
    })

    // Extract unique suggestions (prefer name, fallback to brand)
    const suggestionsSet = new Set<string>()
    
    for (const dpp of dpps) {
      if (dpp.name && dpp.name.toLowerCase().includes(query.toLowerCase())) {
        suggestionsSet.add(dpp.name)
      }
      if (dpp.brand && dpp.brand.toLowerCase().includes(query.toLowerCase())) {
        suggestionsSet.add(dpp.brand)
      }
      // Limit to 8 total suggestions
      if (suggestionsSet.size >= 8) {
        break
      }
    }

    const suggestions = Array.from(suggestionsSet).slice(0, 8)

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_DPPS_SUGGESTIONS] Error:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Laden der Vorschläge",
        details: error?.message ?? "Unknown error"
      },
      { status: 500 }
    )
  }
}

