export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP, requireEditDPP } from "@/lib/api-permissions"
import { generateVerificationToken } from "@/lib/email"
import { sendSupplierDataRequestEmail } from "@/lib/email"

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
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireViewDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    const invites = await prisma.dppSupplierInvite.findMany({
      where: { dppId: resolvedParams.dppId },
      orderBy: { createdAt: "desc" },
    })

    const existingInvites = invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      partnerRole: inv.partnerRole,
      blockIds: (inv.blockIds as string[]) || [],
      fieldInstances: (inv.fieldInstances as Array<{ fieldId: string; instanceId: string; label?: string; assignedSupplier?: string }>) || [],
      supplierMode: inv.supplierMode === "input" ? "input" : inv.supplierMode === "declaration" ? "declaration" : "input",
      status: inv.status,
      emailSentAt: inv.emailSentAt ? inv.emailSentAt.toISOString() : null,
    }))

    return NextResponse.json({ invites: existingInvites })
  } catch (error: any) {
    console.error("Error fetching supplier invites:", error)
    const message = error?.message || "Ein Fehler ist aufgetreten"
    // Hinweis bei fehlender Tabelle (Migration nicht ausgeführt)
    const isPrismaError = error?.code === "P2021" || (typeof message === "string" && message.includes("does not exist"))
    return NextResponse.json(
      { error: isPrismaError ? "Supplier-Invites-Tabelle fehlt. Bitte Migration ausführen: npx prisma migrate deploy" : message },
      { status: 500 }
    )
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
    const blockIds = Array.isArray(selectedBlocks) ? selectedBlocks : []
    const fieldInstances = Array.isArray(selectedFieldInstances) ? selectedFieldInstances : []
    if (blockIds.length === 0 && fieldInstances.length === 0) {
      return NextResponse.json({ error: "Mindestens ein Block oder Feld muss ausgewählt sein" }, { status: 400 })
    }

    const dpp = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      include: { organization: { select: { name: true } } },
    })
    if (!dpp) {
      return NextResponse.json({ error: "DPP nicht gefunden" }, { status: 404 })
    }

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
        message: message ? String(message).trim() : null,
        partnerRole: String(role).trim(),
        blockIds,
        fieldInstances,
        supplierMode,
        status: "pending",
        token,
        expiresAt,
        emailSentAt: sendEmail ? undefined : undefined,
      },
    })

    if (sendEmail) {
      const contributeUrl = `${baseUrl}/contribute/supplier/${token}`
      try {
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
  } catch (error: any) {
    console.error("Error creating supplier invite:", error)
    return NextResponse.json(
      { error: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
