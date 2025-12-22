/**
 * SUPER ADMIN GUARDS
 *
 * Server-side authorization helpers
 * - Server Components: redirect
 * - API Routes: throw / return JSON
 */

import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import { getSuperAdminSession } from "./super-admin-auth"
import {
  requireRole,
  requirePermission,
  SuperAdminRole
} from "./super-admin-rbac"

/* ============================================================================
 * SERVER COMPONENT GUARDS
 * ============================================================================
 */

export async function requireSuperAdminAuth() {
  const session = await getSuperAdminSession()

  if (!session) {
    redirect("/super-admin/login")
  }

  return session
}

export async function requireSuperAdminRole(
  allowedRoles: SuperAdminRole[]
) {
  const session = await requireSuperAdminAuth()

  if (!requireRole(session, allowedRoles)) {
    redirect("/super-admin/dashboard")
  }

  return session
}

export async function requireSuperAdminPermission(
  resource: string,
  action: string
) {
  const session = await requireSuperAdminAuth()

  if (!requirePermission(session, resource, action)) {
    redirect("/super-admin/dashboard")
  }

  return session
}

/* ============================================================================
 * API GUARDS (NO REDIRECTS)
 * ============================================================================
 */

/**
 * API: throws errors (use in try/catch)
 */
export async function requireSuperAdminPermissionApiThrow(
  resource: string,
  action: string
) {
  const session = await getSuperAdminSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  if (!requirePermission(session, resource, action)) {
    throw new Error("Forbidden")
  }

  return session
}

/**
 * API: returns NextResponse on error
 */
export async function requireSuperAdminPermissionApi(
  resource: string,
  action: string
) {
  try {
    return await requireSuperAdminPermissionApiThrow(resource, action)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Fehler bei der Berechtigungsprüfung" },
      { status: 500 }
    )
  }
}
