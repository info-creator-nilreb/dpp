/**
 * SUPER ADMIN USER DETAIL PAGE
 * 
 * View and manage individual user
 * Requires: support_admin or super_admin role (read permission)
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import UserDetailContent from "./UserDetailContent"
import { getUserRole } from "@/lib/phase1/permissions"

export const dynamic = "force-dynamic"

export default async function SuperAdminUserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "user", "read")) {
    redirect("/super-admin/dashboard")
  }

  const canUpdate = requirePermission(session, "user", "update")

  // Get user with organization
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          status: true,
        }
      },
      memberships: {
        select: {
          role: true,
          organizationId: true,
        },
        take: 1,
      }
    }
  })

  if (!user) {
    redirect("/super-admin/users")
  }

  // Get user role
  let role: string | null = null
  if (user.organizationId && user.memberships.length > 0) {
    role = user.memberships[0].role
  } else if (user.organizationId) {
    role = await getUserRole(user.id, user.organizationId)
  }

  return (
    <UserDetailContent 
      user={{
        ...user,
        role,
        organizationName: user.organization?.name || null,
        organizationId: user.organization?.id || null,
      }}
      canUpdate={canUpdate}
    />
  )
}

