/**
 * SUPER ADMIN FEATURE REGISTRY PAGE
 * 
 * List all features with filtering
 * Server Component with direct Prisma access
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FeatureRegistryContent from "./FeatureRegistryContent";

export const dynamic = "force-dynamic";

interface SuperAdminFeatureRegistryPageProps {
  searchParams: Promise<{
    category?: string;
    minimumPlan?: string;
    status?: string;
  }>;
}

export default async function SuperAdminFeatureRegistryPage({
  searchParams,
}: SuperAdminFeatureRegistryPageProps) {
  const session = await getSuperAdminSession();

  if (!session) {
    redirect("/super-admin/login");
  }

  // Parse searchParams - URL is source of truth
  const params = await searchParams;
  const categoryFilter = params.category?.trim() || "";
  const minimumPlanFilter = params.minimumPlan?.trim() || "";
  const statusFilter = params.status?.trim() || "";

  // Build WHERE clause dynamically from searchParams
  const where: any = {};

  // Category filter
  if (categoryFilter) {
    where.category = categoryFilter;
  }

  // Minimum Plan filter
  if (minimumPlanFilter) {
    where.minimumPlan = minimumPlanFilter;
  }

  // Status filter (enabled field)
  if (statusFilter === "active") {
    where.enabled = true;
  } else if (statusFilter === "inactive") {
    where.enabled = false;
  }

  // Get all features (filtered) with all required fields
  const featuresRaw = await prisma.featureRegistry.findMany({
    where,
    orderBy: [
      { category: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      category: true,
      capabilityKey: true,
      minimumPlan: true,
      requiresActiveSubscription: true,
      requiresPublishingCapability: true,
      visibleInTrial: true,
      usableInTrial: true,
      configSchema: true,
      enabled: true,
      defaultForNewDpps: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Convert Date objects to ISO strings for client component
  const features = featuresRaw.map((feature) => ({
    ...feature,
    createdAt: feature.createdAt.toISOString(),
    updatedAt: feature.updatedAt.toISOString(),
  }));

  // Extract unique categories from all features (not just filtered) for filter options
  const allFeatures = await prisma.featureRegistry.findMany({
    select: { category: true },
    distinct: ["category"],
  });
  const availableCategories = allFeatures.map((f) => f.category).filter(Boolean);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
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
            Funktionen
          </h1>
          <p style={{ color: "#7A7A7A", marginTop: "0.5rem" }}>
            Systemweite Funktionen und Tarifzuordnung
          </p>
        </div>
      </div>

      <FeatureRegistryContent
        features={features}
        availableCategories={availableCategories}
        currentFilters={{
          category: categoryFilter,
          minimumPlan: minimumPlanFilter,
          status: statusFilter,
        }}
      />
    </div>
  );
}
