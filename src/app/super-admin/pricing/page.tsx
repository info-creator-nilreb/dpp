/**
 * SUPER ADMIN PRICING MANAGEMENT PAGE
 * 
 * Manage pricing plans, subscription models, and prices
 * Server Component with direct Prisma access
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getFeatureDefinition } from "@/features/feature-manifest"
import PricingManagementContent from "./PricingManagementContent"

export const dynamic = "force-dynamic"

export default async function SuperAdminPricingPage() {
  const session = await getSuperAdminSession()

  if (!session) {
    redirect("/super-admin/login")
  }

  // Load all pricing plans with relations
  const pricingPlans = await prisma.pricingPlan.findMany({
    orderBy: [
      { displayOrder: "asc" },
      { name: "asc" }
    ],
    include: {
      features: {
        include: {
          pricingPlan: false
        }
      },
      entitlements: {
        include: {
          pricingPlan: false
        }
      },
      subscriptionModels: {
        include: {
          prices: {
            where: {
              isActive: true,
              OR: [
                { validTo: null },
                { validTo: { gt: new Date() } }
              ]
            },
            orderBy: {
              validFrom: "desc"
            },
            take: 1
          }
        },
        orderBy: [
          { billingInterval: "asc" }
        ]
      },
      _count: {
        select: {
          subscriptionModels: true,
          features: true,
          entitlements: true
        }
      }
    }
  })

  // Load all available features from Feature Registry (read-only); nur billable Features in Tarif-Übersicht
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

  // Load all entitlements (exclude deprecated max_dpp)
  const entitlements = await prisma.entitlement.findMany({
    where: {
      key: {
        not: "max_dpp" // Exclude deprecated max_dpp, use max_published_dpp instead
      }
    },
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
            href="/super-admin/dashboard"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              display: "block",
            }}
          >
            ← Zum Dashboard
          </Link>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#0A0A0A",
            }}
          >
            Preise & Abonnements
          </h1>
          <p style={{ color: "#7A7A7A", marginTop: "0.5rem" }}>
            Pricing Plans, Features, Limits und Subscription Models verwalten
          </p>
        </div>
        <Link
          href="/super-admin/pricing/new"
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
          Neuer Pricing Plan
        </Link>
      </div>

      <PricingManagementContent
        pricingPlans={pricingPlans.map(plan => ({
          ...plan,
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
          subscriptionModels: plan.subscriptionModels.map(model => ({
            ...model,
            createdAt: model.createdAt.toISOString(),
            updatedAt: model.updatedAt.toISOString(),
            prices: model.prices.map(price => ({
              ...price,
              validFrom: price.validFrom.toISOString(),
              validTo: price.validTo?.toISOString() || null,
              createdAt: price.createdAt.toISOString()
            }))
          }))
        }))}
        availableFeatures={availableFeatures}
        entitlements={entitlements}
      />
    </div>
  )
}

