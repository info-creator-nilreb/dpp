/**
 * SUPER ADMIN USERS PAGE
 * 
 * List and manage all users system-wide
 * Requires: support_admin or super_admin role (read permission)
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import UsersTable from "./UsersTable"

export const dynamic = "force-dynamic"

export default async function SuperAdminUsersPage() {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "user", "read")) {
    redirect("/super-admin/dashboard")
  }

  const canCreate = requirePermission(session, "user", "update")

  // Get all users with organization and role information
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        }
      },
      memberships: {
        select: {
          role: true,
          organizationId: true,
        },
        take: 1, // Get first membership for role
      }
    }
  })

  // Transform users to include role from membership
  const usersWithRole = users.map(user => ({
    ...user,
    role: user.memberships[0]?.role || null,
    organizationName: user.organization?.name || null,
    organizationId: user.organization?.id || null,
  }))

  return (
    <div style={{ 
      maxWidth: "100%", 
      margin: "0 auto", 
      padding: "clamp(1rem, 2vw, 2rem)",
      boxSizing: "border-box",
      width: "100%",
      overflowX: "hidden"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <Link
            href="/super-admin/dashboard"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
              marginBottom: "0.5rem",
              display: "block"
            }}
          >
            ← Zum Dashboard
          </Link>
          <h1 style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            margin: 0,
            wordBreak: "break-word"
          }}>
            Benutzer
          </h1>
        </div>
        {canCreate && (
          <Link
            href="/super-admin/users/new"
            style={{
              padding: "clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)",
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
              flexShrink: 0
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Neuer Benutzer
          </Link>
        )}
      </div>

      <UsersTable users={usersWithRole} canCreate={canCreate} />
    </div>
  )
}

