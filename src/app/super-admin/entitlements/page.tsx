/**
 * SUPER ADMIN LIMIT DEFINITIONS PAGE (READ-ONLY)
 * 
 * View system-wide limit definitions
 * Limits are configured per Pricing Plan, not here
 * This page is informational only - no editing or creation
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import LimitDefinitionsContent from "./LimitDefinitionsContent"

export const dynamic = "force-dynamic"

export default async function SuperAdminLimitDefinitionsPage() {
  const session = await getSuperAdminSession()

  if (!session) {
    redirect("/super-admin/login")
  }

  // Load all entitlements (read-only view)
  const entitlements = await prisma.entitlement.findMany({
    orderBy: {
      key: "asc"
    }
  })

  return (
    <div style={{ 
      maxWidth: "1400px", 
      margin: "0 auto", 
      padding: "clamp(1rem, 3vw, 2rem)",
      boxSizing: "border-box"
    }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <Link
            href="/super-admin/pricing"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              display: "block",
            }}
          >
            ← Zurück zu Preise & Abos
          </Link>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#0A0A0A",
            }}
          >
            Limit-Definitionen
          </h1>
          <p style={{ color: "#7A7A7A", marginTop: "0.5rem" }}>
            Systemweite Limit-Definitionen (nur Ansicht). Limits werden in Pricing Plans konfiguriert.
          </p>
        </div>
        <Link
          href="/super-admin/pricing"
          style={{
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: "600",
            display: "inline-block"
          }}
        >
          Zu Pricing Plans
        </Link>
      </div>

      <LimitDefinitionsContent
        entitlements={entitlements}
      />
    </div>
  )
}

