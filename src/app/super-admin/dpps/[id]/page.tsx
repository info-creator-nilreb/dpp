/**
 * SUPER ADMIN DPP DETAIL PAGE
 * 
 * Read-only view of a specific DPP
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import DppDetailContent from "./DppDetailContent"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SuperAdminDppDetailPage({ params }: PageProps) {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "organization", "read")) {
    redirect("/super-admin/dashboard")
  }
  
  const { id } = await params

  // Get DPP with details
  const dpp = await prisma.dpp.findUnique({
    where: { id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          licenseTier: true
        }
      },
      media: {
        orderBy: { uploadedAt: "desc" }
      },
      versions: {
        orderBy: { version: "desc" },
        take: 10
      },
      _count: {
        select: {
          versions: true,
          media: true
        }
      }
    }
  })

  if (!dpp) {
    notFound()
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/super-admin/dpps"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "0.9rem",
            marginBottom: "0.5rem",
            display: "block"
          }}
        >
          ← Zurück zu DPPs
        </Link>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#0A0A0A"
        }}>
          {dpp.name}
        </h1>
        <p style={{ color: "#7A7A7A", marginTop: "0.5rem" }}>
          Read-Only Ansicht - Bearbeitung nicht möglich
        </p>
      </div>

      <DppDetailContent dpp={dpp} />
    </div>
  )
}

