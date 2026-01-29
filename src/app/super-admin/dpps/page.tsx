/**
 * SUPER ADMIN DPPS PAGE
 * 
 * List all DPPs (read-only)
 * Requires: support_admin or super_admin role (read permission)
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import DppsTable from "./DppsTable"

export const dynamic = "force-dynamic"

interface SuperAdminDppsPageProps {
  searchParams: Promise<{
    q?: string
    organizationId?: string
    category?: string
    status?: string
  }>
}

export default async function SuperAdminDppsPage({ searchParams }: SuperAdminDppsPageProps) {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "organization", "read")) {
    redirect("/super-admin/dashboard")
  }

  // Parse searchParams - URL is source of truth
  const params = await searchParams
  const searchQuery = params.q?.trim() || ""
  const organizationId = params.organizationId?.trim() || ""
  const categoryFilter = params.category?.trim() || ""
  const statusFilter = params.status?.trim() || ""

  // Build WHERE clause dynamically from searchParams
  const where: any = {}

  // Search filter (searches in name and brand)
  if (searchQuery) {
    where.OR = [
      {
        name: {
          contains: searchQuery,
          mode: "insensitive"
        }
      },
      {
        brand: {
          contains: searchQuery,
          mode: "insensitive"
        }
      }
    ]
  }

  // Organization filter
  if (organizationId) {
    where.organizationId = organizationId
  }

  // Category filter (normalize to uppercase)
  if (categoryFilter) {
    const normalizedCategory = categoryFilter.toUpperCase()
    if (normalizedCategory === "TEXTILE" || normalizedCategory === "FURNITURE" || normalizedCategory === "OTHER") {
      where.category = normalizedCategory
    }
  }

  // Status filter (normalize to uppercase)
  if (statusFilter) {
    const normalizedStatus = statusFilter.toUpperCase()
    if (normalizedStatus === "DRAFT" || normalizedStatus === "PUBLISHED") {
      where.status = normalizedStatus
    }
  }

  // Get all available categories and statuses from ALL DPPs (before filtering)
  // This ensures filter options only show values that actually exist
  const allDpps = await prisma.dpp.findMany({
    select: {
      category: true,
      status: true
    }
  })

  // Extract unique categories and statuses that actually exist
  const availableCategories = Array.from(
    new Set(allDpps.map(dpp => dpp.category).filter(Boolean))
  ).sort() as string[]
  
  const availableStatuses = Array.from(
    new Set(allDpps.map(dpp => dpp.status).filter(Boolean))
  ).sort() as string[]

  // Get all organizations for filter dropdown
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: { name: "asc" }
  })

  // Get filtered DPPs with organization and counts (after filtering)
  const dpps = await prisma.dpp.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      status: true,
      updatedAt: true,
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          versions: true
        }
      }
    }
  })

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
            href="/super-admin/dashboard"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              display: "block"
            }}
          >
            ← Zum Dashboard
          </Link>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#0A0A0A"
          }}>
            DPPs (Read-Only)
          </h1>
        </div>
      </div>

      <DppsTable
        dpps={dpps}
        organizations={organizations}
        availableCategories={availableCategories}
        availableStatuses={availableStatuses}
        currentFilters={{
          q: searchQuery,
          organizationId,
          category: categoryFilter,
          status: statusFilter
        }}
      />
    </div>
  )
}
