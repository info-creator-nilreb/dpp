"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import DppCard from "@/components/DppCard"
import FilterBar from "./components/FilterBar"
import Pagination from "@/components/ui/Pagination"

interface Dpp {
  id: string
  name: string
  description: string | null
  category: string
  status: string
  updatedAt: Date
  organizationName: string
  mediaCount: number
}

interface DppsContentProps {
  dpps: Dpp[]
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  searchQuery: string
  statusFilter: string
  categoryFilter: string
  availableCategories: string[]
  availableStatuses: string[]
  showStatsIcon?: boolean
}

export default function DppsContent({
  dpps,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  searchQuery,
  statusFilter,
  categoryFilter,
  availableCategories,
  availableStatuses,
  showStatsIcon = true
}: DppsContentProps) {
  const router = useRouter()
  const hasActiveFilters = !!(searchQuery || statusFilter || categoryFilter)

  const buildUrl = (page: number, size?: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (statusFilter) params.set("status", statusFilter)
    if (categoryFilter) params.set("category", categoryFilter)
    if (page > 1) params.set("page", String(page))
    const s = size ?? pageSize
    if (s !== 25) params.set("pageSize", String(s))
    const q = params.toString()
    return `/app/dpps${q ? `?${q}` : ""}`
  }
  const handlePageChange = (page: number) => {
    router.push(buildUrl(page))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const handlePageSizeChange = (size: number) => {
    router.push(buildUrl(1, size))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div>
      <div style={{
        marginBottom: "1rem"
      }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zum Dashboard
        </Link>
      </div>
      
      <div>
        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Produktpässe verwalten
        </h1>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
            margin: 0,
            lineHeight: "1.5"
          }}>
            Verwalten Sie alle Ihre Digitalen Produktpässe an einem Ort.
          </p>
          <Link
            href="/app/create"
            style={{
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(36, 197, 152, 0.3)",
              whiteSpace: "nowrap",
              display: "inline-block"
            }}
          >
            + Neuen Produktpass erstellen
          </Link>
        </div>
      </div>

      {/* Filter Bar - URL-basiert */}
      <FilterBar
        initialSearch={searchQuery}
        initialStatus={statusFilter}
        initialCategory={categoryFilter}
        availableCategories={availableCategories}
        availableStatuses={availableStatuses}
      />

      {/* DPPs Grid */}
      {dpps.length > 0 ? (
        <>
          <div style={{ color: "#7A7A7A", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
            {totalCount} Produktpässe
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gridAutoRows: "1fr",
            gap: "1rem",
            marginBottom: "2rem"
          }}>
            {dpps.map((dpp) => (
              <DppCard
                key={dpp.id}
                id={dpp.id}
                name={dpp.name}
                description={dpp.description}
                organizationName={dpp.organizationName}
                mediaCount={dpp.mediaCount}
                status={dpp.status}
                updatedAt={dpp.updatedAt}
                showStatsIcon={showStatsIcon}
                latestVersion={null}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      ) : (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(2rem, 5vw, 4rem)",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          textAlign: "center"
        }}>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: "1.5rem"
          }}>
            {hasActiveFilters
              ? "Keine Produktpässe gefunden, die den Filterkriterien entsprechen."
              : "Noch keine Produktpässe erstellt."}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/app/create"
              style={{
                display: "inline-block",
                backgroundColor: "#24c598",
                color: "#FFFFFF",
                padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                boxShadow: "0 4px 12px rgba(36, 197, 152, 0.3)"
              }}
            >
              Ersten Produktpass erstellen
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
