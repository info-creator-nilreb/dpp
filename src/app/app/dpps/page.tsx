export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AuthGate from "../_auth/AuthGate"
import DppsContent from "./DppsContent"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface DppsPageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    category?: string
    page?: string
  }>
}

async function DppsPageContent({ searchParams }: DppsPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Parse searchParams - URL ist Source of Truth
  const params = await searchParams
  const searchQuery = params.q?.trim() || ""
  const statusFilter = params.status?.trim() || ""
  const categoryFilter = params.category?.trim() || ""
  const pageParam = params.page
  const page = Math.max(1, parseInt(pageParam || "1", 10))

  const pageSize = 10

  // Get user's organization IDs
  const memberships = await prisma.membership.findMany({
    where: {
      userId: session.user.id
    },
    select: {
      organizationId: true
    }
  })

  const organizationIds = memberships.map(m => m.organizationId)

  // Get all available categories and statuses from user's DPPs (before filtering)
  // This ensures filter options only show values that actually exist
  const allUserDpps = await prisma.dpp.findMany({
    where: {
      organizationId: {
        in: organizationIds
      }
    },
    select: {
      category: true,
      status: true
    }
  })

  // Extract unique categories and statuses that actually exist
  const availableCategories = Array.from(
    new Set(allUserDpps.map(dpp => dpp.category).filter(Boolean))
  ).sort() as string[]
  
  const availableStatuses = Array.from(
    new Set(allUserDpps.map(dpp => dpp.status || "DRAFT").filter(Boolean))
  ).sort() as string[]

  if (organizationIds.length === 0) {
    return (
      <DppsContent
        dpps={[]}
        currentPage={1}
        totalPages={0}
        totalCount={0}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        availableCategories={[]}
        availableStatuses={[]}
      />
    )
  }

  // Build WHERE clause - direkt aus searchParams
  const where: any = {
    organizationId: {
      in: organizationIds
    }
  }

  // Add search filter (searches in name, description, SKU)
  if (searchQuery) {
    where.OR = [
      {
        name: {
          contains: searchQuery,
          mode: "insensitive"
        }
      },
      {
        description: {
          contains: searchQuery,
          mode: "insensitive"
        }
      },
      {
        sku: {
          contains: searchQuery,
          mode: "insensitive"
        }
      }
    ]
  }

  // Add status filter (normalize to uppercase)
  if (statusFilter) {
    const normalizedStatus = statusFilter.toUpperCase()
    if (normalizedStatus === "DRAFT" || normalizedStatus === "PUBLISHED") {
      where.status = normalizedStatus
    }
  }

  // Add category filter
  if (categoryFilter) {
    const normalizedCategory = categoryFilter.toUpperCase()
    if (normalizedCategory === "TEXTILE" || normalizedCategory === "FURNITURE" || normalizedCategory === "OTHER") {
      where.category = normalizedCategory
    }
  }

  // Get total count for pagination
  const totalCount = await prisma.dpp.count({ where })
  const totalPages = Math.ceil(totalCount / pageSize)

  // Get paginated DPPs with select (performance-optimiert)
  const dpps = await prisma.dpp.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      status: true,
      updatedAt: true,
      organization: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          media: true
        }
      }
    }
  })

  // Transform to display format
  const transformedDpps = dpps.map(dpp => ({
    id: dpp.id,
    name: dpp.name,
    description: dpp.description,
    category: dpp.category,
    status: dpp.status || "DRAFT",
    updatedAt: dpp.updatedAt,
    organizationName: dpp.organization.name,
    mediaCount: dpp._count.media
  }))

  return (
    <DppsContent
      dpps={transformedDpps}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      categoryFilter={categoryFilter}
      availableCategories={availableCategories}
      availableStatuses={availableStatuses}
    />
  )
}

export default async function DppsPage(props: DppsPageProps) {
  return (
    <AuthGate>
      <Suspense fallback={
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          padding: "2rem"
        }}>
          <LoadingSpinner message="Produktpässe werden geladen..." />
        </div>
      }>
        <DppsPageContent {...props} />
      </Suspense>
    </AuthGate>
  )
}
