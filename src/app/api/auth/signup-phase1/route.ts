/**
 * POST /api/auth/signup-phase1
 * 
 * Phase 1 Signup Flow
 * - Erfasst: firstName, lastName, email, password
 * - organizationAction: create_new_organization | request_to_join_organization
 * - Optional: invitationToken
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { signupUser, isEmailRegistered, type OrganizationAction } from "@/lib/phase1/signup"
import { logOrganizationCreated } from "@/lib/phase1/audit"
import { getClientIp } from "@/lib/audit/get-client-ip"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      password,
      organizationAction,
      organizationName,
      organizationId,
      invitationToken,
    } = body

    // Validierung: Pflichtfelder
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "firstName, lastName, email und password sind erforderlich" },
        { status: 400 }
      )
    }

    // Validierung: organizationAction
    if (!organizationAction || !["create_new_organization", "request_to_join_organization"].includes(organizationAction)) {
      return NextResponse.json(
        { error: "organizationAction muss 'create_new_organization' oder 'request_to_join_organization' sein" },
        { status: 400 }
      )
    }

    // Validierung: Passwort-Mindestlänge
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      )
    }

    // Prüfe ob E-Mail bereits registriert ist
    if (await isEmailRegistered(email)) {
      return NextResponse.json(
        { error: "Diese E-Mail ist bereits registriert" },
        { status: 400 }
      )
    }

    // Signup durchführen
    const result = await signupUser({
      firstName,
      lastName,
      email,
      password,
      organizationAction: organizationAction as OrganizationAction,
      organizationName,
      organizationId,
      invitationToken,
    })

    // Audit Log: Organisation erstellt
    if (organizationAction === "create_new_organization") {
      await logOrganizationCreated(
        result.organizationId,
        result.userId,
        result.role
      )
    }

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
        organizationId: result.organizationId,
        role: result.role,
        message: organizationAction === "create_new_organization"
          ? "Organisation und Konto erfolgreich erstellt"
          : "Beitrittsanfrage erfolgreich erstellt",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[SIGNUP_PHASE1] Error:", error)
    
    // Spezifische Fehlermeldungen
    if (error.message === "Email already registered") {
      return NextResponse.json(
        { error: "Diese E-Mail ist bereits registriert" },
        { status: 400 }
      )
    }

    if (error.message === "Organization not found") {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    if (error.message === "Organization name required") {
      return NextResponse.json(
        { error: "Organisationsname ist erforderlich" },
        { status: 400 }
      )
    }

    if (error.message === "Organization ID required") {
      return NextResponse.json(
        { error: "Organisations-ID ist erforderlich" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

