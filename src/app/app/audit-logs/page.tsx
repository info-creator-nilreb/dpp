/**
 * AUDIT LOG PAGE
 * 
 * Organization-level audit log view
 * Read-only, immutable history of all compliance-relevant and AI-assisted actions
 */

import { getServerSession } from "next-auth"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { canAccessAuditLogs } from "@/lib/audit/audit-access"
import AuditLogsClient from "./AuditLogsClient"

export const dynamic = "force-dynamic"

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user's organization
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      organization: true,
    },
  })

  if (!membership) {
    redirect("/app/dashboard")
  }

  // Check access
  const hasAccess = await canAccessAuditLogs(
    session.user.id,
    membership.organizationId
  )

  if (!hasAccess) {
    redirect("/app/dashboard")
  }

  // Parse search params
  const organizationId = membership.organizationId
  const dppId = typeof searchParams.dppId === "string" ? searchParams.dppId : undefined
  const page = parseInt(typeof searchParams.page === "string" ? searchParams.page : "1")
  const limit = parseInt(typeof searchParams.limit === "string" ? searchParams.limit : "50")

  return (
    <div style={{
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "clamp(1rem, 3vw, 2rem)",
      boxSizing: "border-box"
    }}>
      <AuditLogsClient
        organizationId={organizationId}
        dppId={dppId}
        initialPage={page}
        initialLimit={limit}
      />
    </div>
  )
}


