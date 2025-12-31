/**
 * SUPER ADMIN CREATE ORGANIZATION PAGE
 * 
 * Create a new organization (internal only)
 * Requires: support_admin or super_admin role (update permission)
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import Link from "next/link"
import CreateOrganizationContent from "./CreateOrganizationContent"

export const dynamic = "force-dynamic"

export default async function CreateOrganizationPage() {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "organization", "update")) {
    redirect("/super-admin/organizations")
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
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
          Neue Organisation erstellen
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "0.9rem",
          marginTop: "0.5rem"
        }}>
          Erstellen Sie eine neue Organisation mit einem Admin-Benutzer. Eine Einladungs-E-Mail wird automatisch gesendet.
        </p>
      </div>

      <CreateOrganizationContent />
    </div>
  )
}

