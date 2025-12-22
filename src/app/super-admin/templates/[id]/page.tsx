/**
 * SUPER ADMIN TEMPLATE EDITOR PAGE
 * 
 * Edit a template (blocks and fields)
 * Server Component with direct Prisma access
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import TemplateEditorContent from "./TemplateEditorContent"

export const dynamic = "force-dynamic"

interface SuperAdminTemplateEditorPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SuperAdminTemplateEditorPage({ params }: SuperAdminTemplateEditorPageProps) {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }

  const canRead = requirePermission(session, "template", "read")
  const canEdit = requirePermission(session, "template", "update")

  if (!canRead) {
    redirect("/super-admin/dashboard")
  }

  const { id } = await params

  // Load template with blocks and fields
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: {
          fields: {
            orderBy: { order: "asc" }
          }
        }
      }
    }
  })

  if (!template) {
    redirect("/super-admin/templates")
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
            Template bearbeiten: {template.name}
          </h1>
        </div>
      </div>

      <TemplateEditorContent template={template} canEdit={canEdit} />
    </div>
  )
}

