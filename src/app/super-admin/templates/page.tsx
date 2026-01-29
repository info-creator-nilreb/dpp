/**
 * SUPER ADMIN TEMPLATES OVERVIEW PAGE
 * 
 * Lists all templates grouped by category
 * Server Component with direct Prisma access
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import TemplateCard from "./TemplateCard"
import TemplatesHeader from "./TemplatesHeader"

export const dynamic = "force-dynamic"

export default async function SuperAdminTemplatesPage() {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }

  if (!requirePermission(session, "template", "read")) {
    redirect("/super-admin/dashboard")
  }

  // Load all templates with blocks and fields
  const templates = await prisma.template.findMany({
    orderBy: [
      { category: "asc" },
      { version: "desc" }
    ],
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: {
          fields: {
            orderBy: { order: "asc" }
          }
        }
      },
      _count: {
        select: {
          blocks: true
        }
      }
    }
  })

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    const category = template.category || "OTHER"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, typeof templates>)

  const categoryLabels: Record<string, string> = {
    FURNITURE: "Möbel",
    TEXTILE: "Textilien",
    OTHER: "Sonstige"
  }

  return (
    <div style={{ 
      maxWidth: "1400px", 
      margin: "0 auto", 
      padding: "clamp(1rem, 3vw, 2rem)",
      boxSizing: "border-box"
    }}>
      <TemplatesHeader />

      {Object.keys(templatesByCategory).length === 0 ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          backgroundColor: "#F9F9F9",
          borderRadius: "12px",
          border: "1px solid #E5E5E5"
        }}>
          <p style={{ color: "#7A7A7A", fontSize: "1rem", marginBottom: "1rem" }}>
            Noch keine Templates vorhanden
          </p>
          <Link
            href="/super-admin/templates/new"
            style={{
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              padding: "clamp(0.625rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
              fontWeight: "600",
              display: "inline-block",
              whiteSpace: "nowrap",
              transition: "background-color 0.2s"
            }}
          >
            Erstes Template erstellen
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h2 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "1rem"
              }}>
                {categoryLabels[category] || category}
              </h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem"
              }}>
                {categoryTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    id={template.id}
                    name={template.name}
                    description={template.description}
                    status={template.status}
                    version={template.version}
                    blockCount={template._count.blocks}
                    updatedAt={template.updatedAt}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

