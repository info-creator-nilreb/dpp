export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP, requireEditDPP } from "@/lib/api-permissions"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"

/**
 * GET /api/app/dpp/[dppId]/supplier-invites
 *
 * Liefert alle Supplier-Einladungen für diesen DPP.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const session = await auth()

    if (!dppId) {
      return NextResponse.json({ invites: [] })
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireViewDPP(dppId, session.user.id)
    if (permissionError) return permissionError

    let invites
    try {
      invites = await prisma.dppSupplierInvite.findMany({
        where: { dppId },
        orderBy: { createdAt: "desc" },
      })
    } catch (dbError: unknown) {
      const msg = dbError && typeof (dbError as { message?: string }).message === "string" ? (dbError as { message: string }).message : ""
      const code = (dbError as { code?: string })?.code
      console.warn("[supplier-invites GET] DB error:", code, msg)
      return NextResponse.json({ invites: [] })
    }

    const existingInvites = invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      partnerRole: inv.partnerRole,
      blockIds: Array.isArray(inv.blockIds) ? inv.blockIds : [],
      fieldInstances: Array.isArray(inv.fieldInstances) ? inv.fieldInstances : [],
      supplierMode: inv.supplierMode === "input" ? "input" : inv.supplierMode === "declaration" ? "declaration" : "input",
      status: inv.status,
      emailSentAt: inv.emailSentAt ? inv.emailSentAt.toISOString() : null,
    }))

    return NextResponse.json({ invites: existingInvites })
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; stack?: string }
    console.error("[supplier-invites GET] Error:", err?.message, err?.code, err?.stack)
    return NextResponse.json({ invites: [] })
  }
}

/**
 * POST /api/app/dpp/[dppId]/supplier-invites
 *
 * Erstellt eine neue Supplier-Einladung.
 * Body: { email, name?, company?, message?, role, mode: "contribute"|"review", selectedBlocks: string[], selectedFieldInstances: FieldInstance[], sendEmail?: boolean }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireEditDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    const body = await request.json()
    const {
      email,
      name,
      company,
      message,
      role,
      mode,
      selectedBlocks,
      selectedFieldInstances,
      sendEmail = true,
    } = body

    if (!email || !String(email).trim()) {
      return NextResponse.json({ error: "E-Mail ist erforderlich" }, { status: 400 })
    }
    if (!role || !String(role).trim()) {
      return NextResponse.json({ error: "Rolle ist erforderlich" }, { status: 400 })
    }
    if (!mode || (mode !== "contribute" && mode !== "review")) {
      return NextResponse.json({ error: "Modus muss 'contribute' oder 'review' sein" }, { status: 400 })
    }
    const blockIdsRaw = Array.isArray(selectedBlocks) ? selectedBlocks : []
    const fieldInstancesRaw = Array.isArray(selectedFieldInstances) ? selectedFieldInstances : []
    if (blockIdsRaw.length === 0 && fieldInstancesRaw.length === 0) {
      return NextResponse.json({ error: "Mindestens ein Block oder Feld muss ausgewählt sein" }, { status: 400 })
    }

    // Prisma Json-Felder: sauber serialisierbare Arrays übergeben (vermeidet Prisma-Fehler)
    const blockIds = JSON.parse(JSON.stringify(blockIdsRaw)) as string[]
    const fieldInstances = JSON.parse(JSON.stringify(fieldInstancesRaw)) as unknown[]

    const dpp = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      include: { organization: { select: { name: true } } },
    })
    if (!dpp) {
      return NextResponse.json({ error: "DPP nicht gefunden" }, { status: 404 })
    }

    const { generateVerificationToken } = await import("@/lib/email")
    const token = generateVerificationToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    const supplierMode = mode === "review" ? "declaration" : "input"

    const invite = await prisma.dppSupplierInvite.create({
      data: {
        dppId: resolvedParams.dppId,
        email: String(email).trim().toLowerCase(),
        name: name ? String(name).trim() : null,
        company: company ? String(company).trim() : null,
        message: message ? String(message).trim() || null : null,
        partnerRole: String(role).trim(),
        blockIds,
        fieldInstances: fieldInstances as unknown as Prisma.InputJsonValue,
        supplierMode,
        status: "pending",
        token,
        expiresAt,
      },
    })

    if (sendEmail) {
      const contributeUrl = `${baseUrl}/contribute/supplier/${token}`
      try {
        const { sendSupplierDataRequestEmail } = await import("@/lib/email")
        await sendSupplierDataRequestEmail(invite.email, {
          organizationName: dpp.organization.name,
          productName: dpp.name,
          partnerRole: invite.partnerRole,
          contributeUrl,
        })
        await prisma.dppSupplierInvite.update({
          where: { id: invite.id },
          data: { emailSentAt: new Date() },
        })
      } catch (emailError) {
        console.error("Error sending supplier invite email:", emailError)
        // Invite is created; email can be sent later via send-pending
      }
    }

    const out = {
      id: invite.id,
      email: invite.email,
      partnerRole: invite.partnerRole,
      blockIds: (invite.blockIds as string[]) || [],
      fieldInstances: (invite.fieldInstances as unknown[]) || [],
      supplierMode: invite.supplierMode,
      status: invite.status,
      emailSentAt: invite.emailSentAt ? invite.emailSentAt.toISOString() : null,
    }
    return NextResponse.json({ invite: out })
  } catch (error: unknown) {
    const prismaError = error as { message?: string; code?: string; meta?: unknown }
    console.error("Error creating supplier invite:", prismaError?.message, prismaError?.code, prismaError?.meta)
    const message =
      prismaError?.message ||
      (typeof error === "string" ? error : "Ein Fehler ist aufgetreten")
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
