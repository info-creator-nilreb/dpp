/**
 * SUPER ADMIN CREATE USER PAGE
 * 
 * Create a new user
 * Requires: support_admin or super_admin role (update permission)
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CreateUserContent from "./CreateUserContent"

export const dynamic = "force-dynamic"

export default async function SuperAdminCreateUserPage() {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "user", "update")) {
    redirect("/super-admin/users")
  }

  // Get all organizations for dropdown
  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    }
  })

  return (
    <CreateUserContent organizations={organizations} />
  )
}

