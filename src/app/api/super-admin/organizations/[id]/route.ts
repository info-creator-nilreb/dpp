/**
 * SUPER ADMIN ORGANIZATION API (Single)
 * 
 * Update and manage a specific organization
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { getClientIp, getClientUserAgent } from "@/lib/super-admin-audit"
import { logSuperAdminOrganizationUpdate, logSuperAdminOrganizationSuspension, logSuperAdminOrganizationReactivation } from "@/lib/phase1.5/super-admin-audit"
import { getHighestSensitivityLevel, requiresReason } from "@/lib/phase1.5/organization-sensitivity"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: Get organization details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            lastLoginAt: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            dpps: true
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORG] GET error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Organisation" },
      { status: 500 }
    )
  }
}

// PUT: Update organization
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      licenseTier, 
      status,
      // Phase 1: Company Details
      legalName,
      companyType,
      vatId,
      commercialRegisterId,
      addressStreet,
      addressZip,
      addressCity,
      addressCountry,
      country,
      // Phase 1: Billing Information
      billingEmail,
      billingContactUserId,
      invoiceAddressStreet,
      invoiceAddressZip,
      invoiceAddressCity,
      invoiceAddressCountry,
      billingCountry,
      // Phase 1.5: Confirmation reason
      reason,
      // Phase 1.6: Mandatory confirmation flag
      _confirmed,
    } = body

    // Phase 1.6: Backend Guard - Reject if confirmation flag is missing
    if (!_confirmed) {
      return NextResponse.json(
        { error: "Bestätigung erforderlich. Diese Änderung muss über die UI bestätigt werden." },
        { status: 400 }
      )
    }

    // Get current state for audit
    const current = await prisma.organization.findUnique({
      where: { id },
      select: {
        name: true,
        licenseTier: true,
        status: true,
        legalName: true,
        companyType: true,
        vatId: true,
        commercialRegisterId: true,
        addressStreet: true,
        addressZip: true,
        addressCity: true,
        addressCountry: true,
        country: true,
        billingEmail: true,
        billingContactUserId: true,
        invoiceAddressStreet: true,
        invoiceAddressZip: true,
        invoiceAddressCity: true,
        invoiceAddressCountry: true,
        billingCountry: true,
      }
    })

    if (!current) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Validate license tier if provided
    if (licenseTier) {
      const validTiers = ["free", "basic", "premium", "pro"]
      if (!validTiers.includes(licenseTier)) {
        return NextResponse.json(
          { error: "Ungültiger License Tier" },
          { status: 400 }
        )
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ["active", "suspended", "archived"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Ungültiger Status" },
          { status: 400 }
        )
      }
    }

    // Build update data and track changed fields
    const updateData: any = {}
    const changedFields: string[] = []
    
    if (name !== undefined && name.trim() !== current.name) {
      updateData.name = name.trim()
      changedFields.push("name")
    }
    if (licenseTier !== undefined && licenseTier !== current.licenseTier) {
      updateData.licenseTier = licenseTier
      changedFields.push("licenseTier")
    }
    if (status !== undefined && status !== current.status) {
      updateData.status = status
      changedFields.push("status")
    }
    
    // Phase 1: Company Details
    if (legalName !== undefined && (legalName?.trim() || null) !== current.legalName) {
      updateData.legalName = legalName?.trim() || null
      changedFields.push("legalName")
    }
    if (companyType !== undefined && (companyType?.trim() || null) !== current.companyType) {
      updateData.companyType = companyType?.trim() || null
      changedFields.push("companyType")
    }
    if (vatId !== undefined && (vatId?.trim() || null) !== current.vatId) {
      updateData.vatId = vatId?.trim() || null
      changedFields.push("vatId")
    }
    if (commercialRegisterId !== undefined && (commercialRegisterId?.trim() || null) !== current.commercialRegisterId) {
      updateData.commercialRegisterId = commercialRegisterId?.trim() || null
      changedFields.push("commercialRegisterId")
    }
    if (addressStreet !== undefined && (addressStreet?.trim() || null) !== current.addressStreet) {
      updateData.addressStreet = addressStreet?.trim() || null
      changedFields.push("addressStreet")
    }
    if (addressZip !== undefined && (addressZip?.trim() || null) !== current.addressZip) {
      updateData.addressZip = addressZip?.trim() || null
      changedFields.push("addressZip")
    }
    if (addressCity !== undefined && (addressCity?.trim() || null) !== current.addressCity) {
      updateData.addressCity = addressCity?.trim() || null
      changedFields.push("addressCity")
    }
    if (addressCountry !== undefined && (addressCountry?.trim() || null) !== current.addressCountry) {
      updateData.addressCountry = addressCountry?.trim() || null
      changedFields.push("addressCountry")
    }
    if (country !== undefined && (country?.trim() || null) !== current.country) {
      updateData.country = country?.trim() || null
      changedFields.push("country")
    }
    
    // Phase 1: Billing Information
    if (billingEmail !== undefined && (billingEmail?.trim() || null) !== current.billingEmail) {
      updateData.billingEmail = billingEmail?.trim() || null
      changedFields.push("billingEmail")
    }
    if (billingContactUserId !== undefined && billingContactUserId !== current.billingContactUserId) {
      updateData.billingContactUserId = billingContactUserId || null
      changedFields.push("billingContactUserId")
    }
    if (invoiceAddressStreet !== undefined && (invoiceAddressStreet?.trim() || null) !== current.invoiceAddressStreet) {
      updateData.invoiceAddressStreet = invoiceAddressStreet?.trim() || null
      changedFields.push("invoiceAddressStreet")
    }
    if (invoiceAddressZip !== undefined && (invoiceAddressZip?.trim() || null) !== current.invoiceAddressZip) {
      updateData.invoiceAddressZip = invoiceAddressZip?.trim() || null
      changedFields.push("invoiceAddressZip")
    }
    if (invoiceAddressCity !== undefined && (invoiceAddressCity?.trim() || null) !== current.invoiceAddressCity) {
      updateData.invoiceAddressCity = invoiceAddressCity?.trim() || null
      changedFields.push("invoiceAddressCity")
    }
    if (invoiceAddressCountry !== undefined && (invoiceAddressCountry?.trim() || null) !== current.invoiceAddressCountry) {
      updateData.invoiceAddressCountry = invoiceAddressCountry?.trim() || null
      changedFields.push("invoiceAddressCountry")
    }
    if (billingCountry !== undefined && (billingCountry?.trim() || null) !== current.billingCountry) {
      updateData.billingCountry = billingCountry?.trim() || null
      changedFields.push("billingCountry")
    }

    // Phase 1.6: Backend Guard - Validate reason for critical changes
    const criticalFields = ["legalName", "vatId", "billingEmail", "licenseTier", "status"]
    const hasCriticalChange = changedFields.some(field => criticalFields.includes(field))
    
    if (hasCriticalChange) {
      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          { error: "Ein Grund ist für kritische Änderungen erforderlich (mindestens 10 Zeichen)" },
          { status: 400 }
        )
      }
    }
    
    // Phase 1.5: Also check sensitivity-based requirements
    if (changedFields.length > 0 && requiresReason(changedFields)) {
      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          { error: "Ein Grund ist für diese Änderung erforderlich (mindestens 10 Zeichen)" },
          { status: 400 }
        )
      }
    }

    // If no changes, return early
    if (changedFields.length === 0) {
      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
              lastLoginAt: true,
            },
          },
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              dpps: true
            }
          }
        }
      })
      return NextResponse.json({ organization })
    }

    // Handle status changes separately (suspension/reactivation)
    if (updateData.status && updateData.status !== current.status) {
      if (updateData.status === "suspended") {
        if (!reason || reason.trim().length < 10) {
          return NextResponse.json(
            { error: "Ein Grund ist für die Sperrung erforderlich (mindestens 10 Zeichen)" },
            { status: 400 }
          )
        }
        await logSuperAdminOrganizationSuspension(
          session.id,
          id,
          reason.trim(),
          getClientIp(request),
          getClientUserAgent(request)
        )
      } else if (updateData.status === "active" && current.status === "suspended") {
        if (!reason || reason.trim().length < 10) {
          return NextResponse.json(
            { error: "Ein Grund ist für die Reaktivierung erforderlich (mindestens 10 Zeichen)" },
            { status: 400 }
          )
        }
        await logSuperAdminOrganizationReactivation(
          session.id,
          id,
          reason.trim(),
          getClientIp(request),
          getClientUserAgent(request)
        )
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            lastLoginAt: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            dpps: true
          }
        }
      }
    })

    // Phase 1.5: Enhanced audit log (only if not already logged for status changes)
    if (!updateData.status || updateData.status === current.status) {
      const after: Record<string, any> = {}
      changedFields.forEach(field => {
        after[field] = (organization as any)[field]
      })

      await logSuperAdminOrganizationUpdate(
        session.id,
        id,
        changedFields,
        current,
        after,
        reason?.trim(),
        getClientIp(request),
        getClientUserAgent(request)
      )
    }

    return NextResponse.json({ organization })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORG] PUT error:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Organisation" },
      { status: 500 }
    )
  }
}

