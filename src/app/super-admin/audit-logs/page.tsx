/**
 * SUPER ADMIN AUDIT LOGS PAGE
 * 
 * Platform-wide audit log view for Super Admins
 * Full access to all audit logs including system events and cross-organization events
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { redirect } from "next/navigation"
import SuperAdminAuditLogsClient from "./SuperAdminAuditLogsClient"

export const dynamic = "force-dynamic"

export default async function SuperAdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getSuperAdminSession()

  if (!session) {
    redirect("/super-admin/login")
  }

  const resolved = await searchParams
  // Parse search params
  const organizationId = typeof resolved.organizationId === "string" ? resolved.organizationId : undefined
  const dppId = typeof resolved.dppId === "string" ? resolved.dppId : undefined
  const page = parseInt(typeof resolved.page === "string" ? resolved.page : "1")
  const limit = parseInt(typeof resolved.limit === "string" ? resolved.limit : "50")

  return (
    <div style={{
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "clamp(1rem, 3vw, 2rem)",
      boxSizing: "border-box",
      width: "100%",
      overflowX: "hidden"
    }}>
      <SuperAdminAuditLogsClient
        organizationId={organizationId}
        dppId={dppId}
        initialPage={page}
        initialLimit={limit}
      />
    </div>
  )
}

