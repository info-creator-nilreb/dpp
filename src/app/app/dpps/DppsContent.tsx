"use client"

import { useState, useEffect, useCallback } from "react"
import DppCard from "@/components/DppCard"
import Link from "next/link"

interface Dpp {
  id: string
  name: string
  description: string | null
  category: string
  organizationName: string
  mediaCount: number
  status: string
  updatedAt: string
  latestVersion: {
    version: number
    createdAt: string
    createdBy: string
    hasQrCode: boolean
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function DppsContent() {
  const [dpps, setDpps] = useState<Dpp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  // Lade DPPs via API mit Filtern, Suche und Paginierung
  const loadDpps = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", "12")
      if (search) params.append("search", search)
      if (statusFilter) params.append("status", statusFilter)
      if (categoryFilter) params.append("category", categoryFilter)

      const response = await fetch(`/api/app/dpps?${params.toString()}`, {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        setDpps(data.dpps || [])
        setPagination(data.pagination || pagination)
      }
    } catch (error) {
      console.error("Error loading DPPs:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, categoryFilter])

  useEffect(() => {
    loadDpps()
  }, [loadDpps])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, categoryFilter])

  // Handle search with debounce
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
    }, 300) // 300ms debounce
    return () => clearTimeout(timer)
  }, [searchInput])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
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
            href="/app/dpps/create"
            style={{
              backgroundColor: "#E20074",
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

      {/* Suche und Filter */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem"
        }}>
          {/* Suchfeld */}
          <div>
            <label htmlFor="search" style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem"
            }}>
              Suche
            </label>
            <input
              id="search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, Beschreibung, SKU..."
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem"
            }}>
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                backgroundColor: "#FFFFFF",
                boxSizing: "border-box"
              }}
            >
              <option value="">Alle Status</option>
              <option value="DRAFT">Entwurf</option>
              <option value="PUBLISHED">Veröffentlicht</option>
            </select>
          </div>

          {/* Kategorie Filter */}
          <div>
            <label htmlFor="category-filter" style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem"
            }}>
              Kategorie
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                backgroundColor: "#FFFFFF",
                boxSizing: "border-box"
              }}
            >
              <option value="">Alle Kategorien</option>
              <option value="TEXTILE">Textil</option>
              <option value="FURNITURE">Möbel</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>
        </div>

        {/* Aktive Filter anzeigen */}
        {(search || statusFilter || categoryFilter) && (
          <div style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <span style={{
              fontSize: "0.9rem",
              color: "#7A7A7A"
            }}>
              Aktive Filter:
            </span>
            {search && (
              <button
                onClick={() => {
                  setSearchInput("")
                  setSearch("")
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#E20074",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                Suche: "{search}"
                <span>×</span>
              </button>
            )}
            {statusFilter && (
              <button
                onClick={() => setStatusFilter("")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#E20074",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                Status: {statusFilter === "DRAFT" ? "Entwurf" : "Veröffentlicht"}
                <span>×</span>
              </button>
            )}
            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter("")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#E20074",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                Kategorie: {categoryFilter === "TEXTILE" ? "Textil" : categoryFilter === "FURNITURE" ? "Möbel" : "Sonstiges"}
                <span>×</span>
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD"
        }}>
          <p style={{ color: "#7A7A7A" }}>Lade Daten...</p>
        </div>
      ) : dpps.length > 0 ? (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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
                updatedAt={new Date(dpp.updatedAt)}
                latestVersion={dpp.latestVersion}
              />
            ))}
          </div>

          {/* Paginierung */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid #CDCDCD",
                  borderRadius: "6px",
                  backgroundColor: page === 1 ? "#F5F5F5" : "#FFFFFF",
                  color: page === 1 ? "#CDCDCD" : "#0A0A0A",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                ← Zurück
              </button>

              {/* Seitenzahlen */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: "0.75rem 1rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "6px",
                      backgroundColor: page === pageNum ? "#E20074" : "#FFFFFF",
                      color: page === pageNum ? "#FFFFFF" : "#0A0A0A",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: page === pageNum ? "600" : "500",
                      minWidth: "2.5rem"
                    }}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid #CDCDCD",
                  borderRadius: "6px",
                  backgroundColor: page === pagination.totalPages ? "#F5F5F5" : "#FFFFFF",
                  color: page === pagination.totalPages ? "#CDCDCD" : "#0A0A0A",
                  cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                Weiter →
              </button>
            </div>
          )}

          {/* Ergebnisse-Anzeige */}
          <div style={{
            textAlign: "center",
            marginTop: "1rem",
            color: "#7A7A7A",
            fontSize: "0.9rem"
          }}>
            Zeige {dpps.length > 0 ? (page - 1) * pagination.limit + 1 : 0} - {Math.min(page * pagination.limit, pagination.total)} von {pagination.total} Produktpässen
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
            {search || statusFilter || categoryFilter
              ? "Keine Produktpässe gefunden, die den Filterkriterien entsprechen."
              : "Noch keine Produktpässe erstellt."}
          </p>
          {!(search || statusFilter || categoryFilter) && (
            <a
              href="/app/dpps/create"
              style={{
                display: "inline-block",
                backgroundColor: "#E20074",
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
            </a>
          )}
        </div>
      )}
    </div>
  )
}

