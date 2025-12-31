/**
 * Phase 1: Organization Billing API
 * 
 * GET /api/app/organization/billing - Holt Billing Information
 * PUT /api/app/organization/billing - Aktualisiert Billing Information
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateBillingInfo, getOrganizationWithDetails } from "@/lib/phase1/organization"
import { canEditBilling, getUserRole } from "@/lib/phase1/permissions"
import { logBillingUpdated } from "@/lib/phase1/audit"

/**
 * GET /api/app/organization/billing
 * 
 * Holt Billing Information der Organisation
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    const organization = await getOrganizationWithDetails(user.organizationId)

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Hole Subscription-Status (read-only)
    const subscription = organization.subscription

    return NextResponse.json(
      {
        billing: {
          billingEmail: organization.billingEmail,
          billingContactUserId: organization.billingContactUserId,
          invoiceAddressStreet: organization.invoiceAddressStreet,
          invoiceAddressZip: organization.invoiceAddressZip,
          invoiceAddressCity: organization.invoiceAddressCity,
          invoiceAddressCountry: organization.invoiceAddressCountry,
          billingCountry: organization.billingCountry,
        },
        subscription: subscription
          ? {
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
            }
          : null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[BILLING_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/organization/billing
 * 
 * Aktualisiert Billing Information
 * Body: { billingEmail?, billingContactUserId?, invoiceAddressStreet?, invoiceAddressZip?, invoiceAddressCity?, invoiceAddressCountry?, billingCountry? }
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    // Permission-Check: Nur ORG_ADMIN kann Billing bearbeiten
    if (!(await canEditBilling(session.user.id, user.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Bearbeiten der Billing-Informationen" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      billingEmail,
      billingContactUserId,
      invoiceAddressStreet,
      invoiceAddressZip,
      invoiceAddressCity,
      invoiceAddressCountry,
      billingCountry,
    } = body

    // Hole aktuelles Profil für Audit Log
    const currentOrg = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        billingEmail: true,
        billingContactUserId: true,
        invoiceAddressStreet: true,
        invoiceAddressZip: true,
        invoiceAddressCity: true,
        invoiceAddressCountry: true,
        billingCountry: true,
      },
    })

    if (!currentOrg) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Aktualisiere Billing Information
    await updateBillingInfo(user.organizationId, {
      billingEmail,
      billingContactUserId,
      invoiceAddressStreet,
      invoiceAddressZip,
      invoiceAddressCity,
      invoiceAddressCountry,
      billingCountry,
    })

    // Hole Rolle für Audit Log
    const actorRole = await getUserRole(session.user.id, user.organizationId)

    // Audit Log
    await logBillingUpdated(
      user.organizationId,
      session.user.id,
      actorRole || "ORG_ADMIN",
      currentOrg,
      {
        billingEmail,
        billingContactUserId,
        invoiceAddressStreet,
        invoiceAddressZip,
        invoiceAddressCity,
        invoiceAddressCountry,
        billingCountry,
      }
    )

    return NextResponse.json(
      { success: true, message: "Billing Information erfolgreich aktualisiert" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[BILLING_PUT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

