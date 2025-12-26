/**
 * SUPER ADMIN RBAC (Role-Based Access Control)
 * 
 * Server-side authorization checks ONLY.
 * NEVER rely on frontend checks for security.
 */

export type SuperAdminRole = "super_admin" | "support_admin" | "read_only_admin"

export interface Permission {
  resource: string
  action: string
}

/**
 * Permission matrix for each role
 */
const PERMISSIONS: Record<SuperAdminRole, Permission[]> = {
  super_admin: [
    // Full access to everything
    { resource: "*", action: "*" }
  ],
  support_admin: [
    // Organizations
    { resource: "organization", action: "read" },
    { resource: "organization", action: "update" },
    { resource: "organization", action: "suspend" },
    { resource: "organization", action: "unsuspend" },
    // Users/Members
    { resource: "user", action: "read" },
    { resource: "user", action: "update" },
    // Subscriptions
    { resource: "subscription", action: "read" },
    { resource: "subscription", action: "update" },
    // Features
    { resource: "feature", action: "read" },
    { resource: "feature", action: "update" },
    { resource: "feature_registry", action: "read" },
    { resource: "feature_registry", action: "create" },
    { resource: "feature_registry", action: "update" },
    { resource: "feature_registry", action: "delete" },
    // Templates
    { resource: "template", action: "read" },
    { resource: "template", action: "update" },
    // Audit
    { resource: "audit", action: "read" },
    // NO billing deletion, NO admin management
  ],
  read_only_admin: [
    // Read-only access
    { resource: "organization", action: "read" },
    { resource: "user", action: "read" },
    { resource: "subscription", action: "read" },
    { resource: "feature", action: "read" },
    { resource: "feature_registry", action: "read" },
    { resource: "template", action: "read" },
    { resource: "audit", action: "read" }
  ]
}

/**
 * Check if role has permission for resource/action
 */
export function hasPermission(role: SuperAdminRole, resource: string, action: string): boolean {
  const rolePermissions = PERMISSIONS[role] || []

  // Super admin has all permissions
  if (role === "super_admin") {
    return true
  }

  return rolePermissions.some(
    (perm) =>
      (perm.resource === "*" || perm.resource === resource) &&
      (perm.action === "*" || perm.action === action)
  )
}

/**
 * Require specific role(s)
 */
export function requireRole(
  session: { role: SuperAdminRole } | null,
  allowedRoles: SuperAdminRole[]
): boolean {
  if (!session) {
    return false
  }

  return allowedRoles.includes(session.role)
}

/**
 * Require permission
 */
export function requirePermission(
  session: { role: SuperAdminRole } | null,
  resource: string,
  action: string
): boolean {
  if (!session) {
    return false
  }

  return hasPermission(session.role, resource, action)
}

