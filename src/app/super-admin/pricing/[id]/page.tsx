/**
 * SUPER ADMIN PRICING PLAN EDIT PAGE
 * 
 * Edit existing pricing plan with full configuration
 * Server Component with direct Prisma access
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getFeatureDefinition } from "@/features/feature-manifest"
import PricingPlanEditor from "./PricingPlanEditor"
import { getAllEntitlementDefinitions } from "@/lib/pricing/entitlement-definitions"

export const dynamic = "force-dynamic"

export default async function EditPricingPlanPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSuperAdminSession()
  const { id } = await params

  if (!session) {
    redirect("/super-admin/login")
  }

  // Load pricing plan with all relations
  const pricingPlan = await prisma.pricingPlan.findUnique({
    where: { id },
    include: {
      features: true,
      entitlements: true,
      subscriptionModels: {
        include: {
          prices: {
            orderBy: {
              validFrom: "desc"
            }
          },
          trialFeatureOverrides: true,
          trialEntitlementOverrides: true
        },
        orderBy: [
          { billingInterval: "asc" }
        ]
      }
    }
  })

  if (!pricingPlan) {
    redirect("/super-admin/pricing")
  }

  // Load all available features from Feature Registry (read-only); nur billable Features
  const allFeatures = await prisma.featureRegistry.findMany({
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
  const availableFeatures = allFeatures.filter(
    (f) => getFeatureDefinition(f.key)?.isBillable !== false
  )

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
            {pricingPlan.name} bearbeiten
          </h1>
          <p style={{ color: "#7A7A7A", marginTop: "0.5rem" }}>
            Pricing Plan konfigurieren: Features, Limits, Subscription Models und Preise
          </p>
        </div>
      </div>

      <PricingPlanEditor
        pricingPlan={{
          ...pricingPlan,
          createdAt: pricingPlan.createdAt.toISOString(),
          updatedAt: pricingPlan.updatedAt.toISOString(),
          subscriptionModels: pricingPlan.subscriptionModels.map(model => ({
            ...model,
            createdAt: model.createdAt.toISOString(),
            updatedAt: model.updatedAt.toISOString(),
            prices: model.prices.map(price => ({
              ...price,
              validFrom: price.validFrom.toISOString(),
              validTo: price.validTo?.toISOString() || null,
              createdAt: price.createdAt.toISOString()
            })),
            trialFeatureOverrides: (model.trialFeatureOverrides || []).map(override => ({
              ...override,
              createdAt: override.createdAt.toISOString(),
              updatedAt: override.updatedAt.toISOString()
            })),
            trialEntitlementOverrides: (model.trialEntitlementOverrides || []).map(override => ({
              ...override,
              createdAt: override.createdAt.toISOString(),
              updatedAt: override.updatedAt.toISOString()
            }))
          }))
        }}
        availableFeatures={availableFeatures}
        entitlements={entitlements}
      />
    </div>
  )
}

