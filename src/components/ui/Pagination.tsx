"use client"

/**
 * Global Pagination – Editorial SaaS Standard
 * Centered, minimal, design-system aligned. Used across User App and Super Admin.
 * Total item count is shown above the table, not here.
 */

import { useEffect, useMemo, useState } from "react"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 25
const MAX_VISIBLE_PAGES_DESKTOP = 5
const MAX_VISIBLE_PAGES_MOBILE = 3

const textSecondary = "var(--color-text-secondary, #7A7A7A)"
const textPrimary = "var(--color-text-primary, #0A0A0A)"
const accent = "var(--color-accent, #24c598)"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = "",
}: PaginationProps) {
  const safePageSize = PAGE_SIZE_OPTIONS.includes(pageSize as 10 | 25 | 50 | 100) ? pageSize : DEFAULT_PAGE_SIZE

  const visiblePages = useMemo(() => {
    if (totalPages <= 0) return []
    const maxVisible = MAX_VISIBLE_PAGES_DESKTOP
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    const pages: (number | "ellipsis")[] = []
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push("ellipsis")
    }
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("ellipsis")
      pages.push(totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  const [maxVisible, setMaxVisible] = useState(MAX_VISIBLE_PAGES_DESKTOP)
  useEffect(() => {
    const update = () => setMaxVisible(window.innerWidth < 768 ? MAX_VISIBLE_PAGES_MOBILE : MAX_VISIBLE_PAGES_DESKTOP)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  const visiblePagesResponsive = useMemo(() => {
    if (totalPages <= 0) return []
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    const pages: (number | "ellipsis")[] = []
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push("ellipsis")
    }
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("ellipsis")
      pages.push(totalPages)
    }
    return pages
  }, [currentPage, totalPages, maxVisible])
  const pagesToShow = typeof window !== "undefined" ? visiblePagesResponsive : visiblePages

  if (totalPages <= 0 && totalItems <= 0) return null

  const showPagination = totalPages > 1 || totalItems > safePageSize

  return (
    <div
      className={className}
      style={{
        width: "100%",
        marginTop: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
      }}
    >
      {/* Page navigation row */}
      {showPagination && (
        <nav
          role="navigation"
          aria-label="Paginierung"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Vorherige Seite"
            style={{
              padding: "0.5rem 0.75rem",
              border: "none",
              background: "none",
              color: currentPage <= 1 ? textSecondary : textPrimary,
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              fontSize: "inherit",
              opacity: currentPage <= 1 ? 0.35 : 1,
              pointerEvents: currentPage <= 1 ? "none" : "auto",
              transition: "color 150ms ease, opacity 150ms ease",
            }}
          >
            ←
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {pagesToShow.map((p, i) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${i}`}
                  style={{ padding: "0.5rem", color: textSecondary, fontSize: "inherit" }}
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={currentPage === p ? "page" : undefined}
                  style={{
                    padding: "0.5rem 0.65rem",
                    minWidth: "2rem",
                    border: "none",
                    background: currentPage === p ? "transparent" : "none",
                    color: currentPage === p ? textPrimary : textSecondary,
                    fontWeight: currentPage === p ? 600 : 400,
                    fontSize: "inherit",
                    cursor: "pointer",
                    borderRadius: currentPage === p ? 0 : "6px",
                    borderBottom: currentPage === p ? `2px solid ${accent}` : "2px solid transparent",
                    transition: "color 150ms ease, border-color 150ms ease",
                  }}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Nächste Seite"
            style={{
              padding: "0.5rem 0.75rem",
              border: "none",
              background: "none",
              color: currentPage >= totalPages ? textSecondary : textPrimary,
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              fontSize: "inherit",
              opacity: currentPage >= totalPages ? 0.35 : 1,
              pointerEvents: currentPage >= totalPages ? "none" : "auto",
              transition: "color 150ms ease, opacity 150ms ease",
            }}
          >
            →
          </button>
        </nav>
      )}

      {/* Page size selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "inherit", color: textSecondary }}>
          <select
            value={safePageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Einträge pro Seite"
            style={{
              padding: "0.35rem 1.5rem 0.35rem 0.5rem",
              border: "none",
              background: "transparent",
              color: textPrimary,
              fontSize: "inherit",
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7A7A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.25rem center",
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} pro Seite
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
