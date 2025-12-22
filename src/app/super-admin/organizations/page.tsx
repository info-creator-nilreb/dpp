/**
 * SUPER ADMIN ORGANIZATIONS PAGE
 * 
 * List and manage organizations
 * Requires: support_admin or super_admin role (read permission)
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import OrganizationsTable from "./OrganizationsTable"

export const dynamic = "force-dynamic"

export default async function SuperAdminOrganizationsPage() {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "organization", "read")) {
    redirect("/super-admin/dashboard")
  }

  // Get all organizations with counts
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          memberships: true,
          dpps: true
        }
      }
    }
  })

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem"
      }}>
        <div>
          <Link
            href="/super-admin/dashboard"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              display: "block"
            }}
          >
            ← Zum Dashboard
          </Link>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#0A0A0A"
          }}>
            Organisationen
          </h1>
        </div>
      </div>

      <OrganizationsTable organizations={organizations} />
    </div>
  )
}

