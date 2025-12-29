/**
 * SUPER ADMIN PRICES API ROUTE
 * 
 * CRUD operations for prices
 * GET: List all prices
 * POST: Create new price (versioned)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { logPriceAction } from "@/lib/audit/audit-helpers"
import { ACTION_TYPES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/audit-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(req.url)
    const subscriptionModelId = searchParams.get("subscriptionModelId")
    const isActive = searchParams.get("isActive")

    const where: any = {}
    if (subscriptionModelId) {
      where.subscriptionModelId = subscriptionModelId
    }
    if (isActive !== null) {
      where.isActive = isActive === "true"
    }

    const prices = await prisma.price.findMany({
      where,
      include: {
        subscriptionModel: {
          include: {
            pricingPlan: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        validFrom: "desc"
      }
    })

    return NextResponse.json({ prices }, { status: 200 })
  } catch (error: any) {
    console.error("[Prices GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Preise" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("template", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const body = await req.json()
    const {
      subscriptionModelId,
      amount,
      currency,
      validFrom,
      validTo,
      isActive
    } = body

    // Validate required fields
    if (!subscriptionModelId || amount === undefined) {
      return NextResponse.json(
        { error: "Subscription Model ID und Amount sind erforderlich" },
        { status: 400 }
      )
    }

    // Check if subscription model exists
    const subscriptionModel = await prisma.subscriptionModel.findUnique({
      where: { id: subscriptionModelId }
    })

    if (!subscriptionModel) {
      return NextResponse.json(
        { error: "Subscription Model nicht gefunden" },
        { status: 404 }
      )
    }

    // Get old active prices for audit log
    const oldActivePrices = await prisma.price.findMany({
      where: {
        subscriptionModelId,
        isActive: true,
        OR: [
          { validTo: null },
          { validTo: { gt: new Date() } }
        ]
      }
    })

    // If this is a new active price, deactivate old active prices
    if (isActive !== false) {
      await prisma.price.updateMany({
        where: {
          subscriptionModelId,
          isActive: true,
          OR: [
            { validTo: null },
            { validTo: { gt: new Date() } }
          ]
        },
        data: {
          isActive: false,
          validTo: validFrom ? new Date(validFrom) : new Date()
        }
      })

      // Audit log: Old prices deactivated
      const ipAddress = getClientIp(req)
      for (const oldPrice of oldActivePrices) {
        await logPriceAction(ACTION_TYPES.UPDATE, oldPrice.id, {
          actorId: session.id,
          actorRole: "SUPER_ADMIN",
          subscriptionModelId,
          fieldName: "isActive",
          oldValue: { isActive: true, validTo: oldPrice.validTo },
          newValue: { isActive: false, validTo: validFrom ? new Date(validFrom) : new Date() },
          source: "API",
          ipAddress,
          metadata: {
            reason: "New price version created"
          }
        })
      }
    }

    // Create new price
    const price = await prisma.price.create({
      data: {
        subscriptionModelId,
        amount: parseInt(amount),
        currency: currency || "EUR",
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validTo: validTo ? new Date(validTo) : null,
        isActive: isActive ?? true
      },
      include: {
        subscriptionModel: {
          include: {
            pricingPlan: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })

    // Audit log: New price created
    const ipAddress = getClientIp(req)
    await logPriceAction(ACTION_TYPES.CREATE, price.id, {
      actorId: session.id,
      actorRole: "SUPER_ADMIN",
      subscriptionModelId,
      newValue: {
        amount: price.amount,
        currency: price.currency,
        validFrom: price.validFrom,
        validTo: price.validTo,
        isActive: price.isActive
      },
      source: "API",
      ipAddress,
      metadata: {
        deactivatedOldPricesCount: oldActivePrices.length
      }
    })

    return NextResponse.json({ price }, { status: 201 })
  } catch (error: any) {
    console.error("[Prices POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen des Preises" },
      { status: 500 }
    )
  }
}

