"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  searchQuery: string
  statusFilter: string
  categoryFilter: string
}

export default function Pagination({
  currentPage,
  totalPages,
  searchQuery,
  statusFilter,
  categoryFilter
}: PaginationProps) {
  const router = useRouter()

  // Build URL with new page number
  const buildUrl = useCallback((page: number) => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set("q", searchQuery)
    if (statusFilter) params.set("status", statusFilter)
    if (categoryFilter) params.set("category", categoryFilter)
    if (page > 1) params.set("page", page.toString())

    const queryString = params.toString()
    return `/app/dpps${queryString ? `?${queryString}` : ""}`
  }, [searchQuery, statusFilter, categoryFilter])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(buildUrl(newPage))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.5rem",
      flexWrap: "wrap",
      marginBottom: "1rem"
    }}>
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: "0.75rem 1rem",
          border: "1px solid #CDCDCD",
          borderRadius: "6px",
          backgroundColor: currentPage === 1 ? "#F5F5F5" : "#FFFFFF",
          color: currentPage === 1 ? "#CDCDCD" : "#0A0A0A",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          fontSize: "0.9rem",
          fontWeight: "500"
        }}
      >
        ← Zurück
      </button>

      {/* Seitenzahlen */}
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let pageNum: number
        if (totalPages <= 5) {
          pageNum = i + 1
        } else if (currentPage <= 3) {
          pageNum = i + 1
        } else if (currentPage >= totalPages - 2) {
          pageNum = totalPages - 4 + i
        } else {
          pageNum = currentPage - 2 + i
        }

        return (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              backgroundColor: currentPage === pageNum ? "#24c598" : "#FFFFFF",
              color: currentPage === pageNum ? "#FFFFFF" : "#0A0A0A",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: currentPage === pageNum ? "600" : "500",
              minWidth: "2.5rem"
            }}
          >
            {pageNum}
          </button>
        )
      })}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: "0.75rem 1rem",
          border: "1px solid #CDCDCD",
          borderRadius: "6px",
          backgroundColor: currentPage === totalPages ? "#F5F5F5" : "#FFFFFF",
          color: currentPage === totalPages ? "#CDCDCD" : "#0A0A0A",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          fontSize: "0.9rem",
          fontWeight: "500"
        }}
      >
        Weiter →
      </button>
    </div>
  )
}
