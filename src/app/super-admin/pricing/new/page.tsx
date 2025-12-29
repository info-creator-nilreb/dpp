/**
 * SUPER ADMIN NEW PRICING PLAN PAGE
 * 
 * Create a new pricing plan
 * Server Component with direct Prisma access
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import NewPricingPlanContent from "./NewPricingPlanContent"
import { getAllEntitlementDefinitions } from "@/lib/pricing/entitlement-definitions"

export const dynamic = "force-dynamic"

export default async function NewPricingPlanPage() {
  const session = await getSuperAdminSession()

  if (!session) {
    redirect("/super-admin/login")
  }

  // Load all available features from Feature Registry (read-only)
  const availableFeatures = await prisma.featureRegistry.findMany({
    where: {
      enabled: true
    },
    orderBy: [
      { category: "asc" },
      { name: "asc" }
    ],
    select: {
      key: true,
      name: true,
      description: true,
      category: true
    }
  })

  // Use predefined entitlement definitions instead of database entries
  // These are the system-wide limit types that can be configured
  const entitlementDefinitions = getAllEntitlementDefinitions()
  
  // Convert definitions to the format expected by the component
  const entitlements = entitlementDefinitions.map((def, index) => ({
    id: `entitlement-${def.key}`, // Synthetic ID for UI
    key: def.key,
    type: "number", // Default type
    unit: def.unit === "count" ? null : def.unit // Convert "count" to null for display
  }))

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
            Neuer Pricing Plan
          </h1>
          <p style={{ color: "#7A7A7A", marginTop: "0.5rem" }}>
            Erstellen Sie einen neuen Pricing Plan mit Features und Limits
          </p>
        </div>
      </div>

      <NewPricingPlanContent
        availableFeatures={availableFeatures}
        entitlements={entitlements}
      />
    </div>
  )
}

