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
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getSuperAdminSession()

  if (!session) {
    redirect("/super-admin/login")
  }

  // Parse search params
  const organizationId = typeof searchParams.organizationId === "string" ? searchParams.organizationId : undefined
  const dppId = typeof searchParams.dppId === "string" ? searchParams.dppId : undefined
  const page = parseInt(typeof searchParams.page === "string" ? searchParams.page : "1")
  const limit = parseInt(typeof searchParams.limit === "string" ? searchParams.limit : "50")

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

