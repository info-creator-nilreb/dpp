/**
 * SUPER ADMIN NEW TEMPLATE PAGE
 * 
 * Create a new template
 * Server Component
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import Link from "next/link"
import NewTemplateContent from "./NewTemplateContent"

export const dynamic = "force-dynamic"

export default async function SuperAdminNewTemplatePage() {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }

  if (!requirePermission(session, "template", "update")) {
    redirect("/super-admin/dashboard")
  }

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
            href="/super-admin/templates"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              display: "block"
            }}
          >
            ← Zurück zu Templates
          </Link>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#0A0A0A"
          }}>
            Neues Template erstellen
          </h1>
        </div>
      </div>

      <NewTemplateContent />
    </div>
  )
}

