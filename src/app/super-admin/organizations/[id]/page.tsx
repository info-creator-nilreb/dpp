/**
 * SUPER ADMIN ORGANIZATION DETAIL PAGE
 * 
 * View and manage a specific organization
 * Requires: support_admin or super_admin role (read permission)
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import OrganizationDetailContent from "./OrganizationDetailContent"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SuperAdminOrganizationDetailPage({ params }: PageProps) {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "organization", "read")) {
    redirect("/super-admin/dashboard")
  }
  
  const { id } = await params

  // Get organization with details
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
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
    notFound()
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/super-admin/organizations"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "0.9rem",
            marginBottom: "0.5rem",
            display: "block"
          }}
        >
          ← Zurück zu Organisationen
        </Link>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#0A0A0A"
        }}>
          {organization.name}
        </h1>
      </div>

      <OrganizationDetailContent
        organization={organization}
        canEdit={session.role === "super_admin" || session.role === "support_admin"}
      />
    </div>
  )
}

