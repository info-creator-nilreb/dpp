export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditBilling } from "@/lib/phase1/permissions"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
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

    if (!(await canEditBilling(session.user.id, user.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung für den Abrechnungsbereich" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")

    const where: { organizationId: string; periodStart?: { gte: Date; lt: Date } } = {
      organizationId: user.organizationId,
    }
    if (yearParam) {
      const y = parseInt(yearParam, 10)
      if (!Number.isNaN(y)) {
        where.periodStart = {
          gte: new Date(y, 0, 1),
          lt: new Date(y + 1, 0, 1),
        }
      }
    }

    let invoices: Array<{
      id: string
      invoiceNumber: string
      periodStart: Date
      periodEnd: Date
      createdAt: Date
      netAmount: number
      taxAmount: number
      totalAmount: number
      currency: string
      status: string
      pdfUrl: string | null
    }> = []
    let years: number[] = []

    try {
      invoices = await prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
          netAmount: true,
          taxAmount: true,
          totalAmount: true,
          currency: true,
          status: true,
          pdfUrl: true,
        },
      })

      const allForYears = await prisma.invoice.findMany({
        where: { organizationId: user.organizationId },
        select: { periodStart: true },
      })
      const yearSet = new Set<number>()
      for (const inv of allForYears) {
        yearSet.add(new Date(inv.periodStart).getFullYear())
      }
      years = Array.from(yearSet).sort((a, b) => b - a)
    } catch (invErr) {
      console.warn("[BILLING_INVOICES] Abfrage fehlgeschlagen (evtl. 'npx prisma generate' und Migration ausführen):", invErr)
    }

    return NextResponse.json({ invoices, years })
  } catch (e: unknown) {
    console.error("[BILLING_INVOICES]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler beim Laden" },
      { status: 500 }
    )
  }
}
