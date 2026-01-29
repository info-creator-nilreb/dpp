"use client"

import Link from "next/link"
import DppCard from "@/components/DppCard"
import FilterBar from "./components/FilterBar"
import Pagination from "./components/Pagination"

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
  searchQuery: string
  statusFilter: string
  categoryFilter: string
  availableCategories: string[]
  availableStatuses: string[]
}

export default function DppsContent({
  dpps,
  currentPage,
  totalPages,
  totalCount,
  searchQuery,
  statusFilter,
  categoryFilter,
  availableCategories,
  availableStatuses
}: DppsContentProps) {
  const hasActiveFilters = !!(searchQuery || statusFilter || categoryFilter)

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
              boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)",
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
                latestVersion={null}
              />
            ))}
          </div>

          {/* Pagination - URL-basiert */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
          />

          {/* Ergebnisse-Anzeige */}
          <div style={{
            textAlign: "center",
            marginTop: "1rem",
            color: "#7A7A7A",
            fontSize: "0.9rem"
          }}>
            Zeige {dpps.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, totalCount)} von {totalCount} Produktpässen
          </div>
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
                boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
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
