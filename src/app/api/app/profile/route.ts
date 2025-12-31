/**
 * Phase 1: User Profile API
 * 
 * GET /api/app/profile - Holt User-Profil
 * PUT /api/app/profile - Aktualisiert User-Profil
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateUserProfile, getUserWithOrganization } from "@/lib/phase1/user-management"
import { getUserRole } from "@/lib/phase1/permissions"
import { logUserProfileUpdated } from "@/lib/phase1/audit"

/**
 * GET /api/app/profile
 * 
 * Holt User-Profil mit Organisation
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const user = await getUserWithOrganization(session.user.id)

    if (!user) {
      return NextResponse.json(
        { error: "User nicht gefunden" },
        { status: 404 }
      )
    }

    // Hole Rolle
    let role = null
    if (user.organizationId) {
      role = await getUserRole(session.user.id, user.organizationId)
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          jobTitle: user.jobTitle,
          phone: user.phone,
          preferredLanguage: user.preferredLanguage,
          timeZone: user.timeZone,
          organizationId: user.organizationId,
          organization: user.organization
            ? {
                id: user.organization.id,
                name: user.organization.name,
                status: user.organization.status,
              }
            : null,
          role,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[PROFILE_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/profile
 * 
 * Aktualisiert User-Profil
 * Body: { firstName?, lastName?, jobTitle?, phone?, preferredLanguage?, timeZone? }
 */
export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      jobTitle,
      phone,
      preferredLanguage,
      timeZone,
    } = body

    // Hole aktuelles Profil für Audit Log
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        jobTitle: true,
        phone: true,
        preferredLanguage: true,
        timeZone: true,
        organizationId: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "User nicht gefunden" },
        { status: 404 }
      )
    }

    // Hole Rolle für Audit Log
    let actorRole = null
    if (currentUser.organizationId) {
      actorRole = await getUserRole(session.user.id, currentUser.organizationId)
    }

    // Aktualisiere Profil
    await updateUserProfile(session.user.id, {
      firstName,
      lastName,
      jobTitle,
      phone,
      preferredLanguage,
      timeZone,
    })

    // Audit Log für geänderte Felder
    if (firstName !== undefined && firstName !== currentUser.firstName) {
      await logUserProfileUpdated(
        session.user.id,
        currentUser.organizationId || "",
        actorRole || "VIEWER",
        "firstName",
        currentUser.firstName,
        firstName
      )
    }

    if (lastName !== undefined && lastName !== currentUser.lastName) {
      await logUserProfileUpdated(
        session.user.id,
        currentUser.organizationId || "",
        actorRole || "VIEWER",
        "lastName",
        currentUser.lastName,
        lastName
      )
    }

    if (jobTitle !== undefined && jobTitle !== currentUser.jobTitle) {
      await logUserProfileUpdated(
        session.user.id,
        currentUser.organizationId || "",
        actorRole || "VIEWER",
        "jobTitle",
        currentUser.jobTitle,
        jobTitle
      )
    }

    if (phone !== undefined && phone !== currentUser.phone) {
      await logUserProfileUpdated(
        session.user.id,
        currentUser.organizationId || "",
        actorRole || "VIEWER",
        "phone",
        currentUser.phone,
        phone
      )
    }

    if (preferredLanguage !== undefined && preferredLanguage !== currentUser.preferredLanguage) {
      await logUserProfileUpdated(
        session.user.id,
        currentUser.organizationId || "",
        actorRole || "VIEWER",
        "preferredLanguage",
        currentUser.preferredLanguage,
        preferredLanguage
      )
    }

    if (timeZone !== undefined && timeZone !== currentUser.timeZone) {
      await logUserProfileUpdated(
        session.user.id,
        currentUser.organizationId || "",
        actorRole || "VIEWER",
        "timeZone",
        currentUser.timeZone,
        timeZone
      )
    }

    return NextResponse.json(
      { success: true, message: "Profil erfolgreich aktualisiert" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[PROFILE_PUT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

