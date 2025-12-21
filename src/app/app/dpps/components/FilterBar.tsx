"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"

interface FilterBarProps {
  initialSearch?: string
  initialStatus?: string
  initialCategory?: string
}

export default function FilterBar({
  initialSearch = "",
  initialStatus = "",
  initialCategory = ""
}: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Nur für Input-Felder (wird debounced zur URL geschrieben)
  const [searchInput, setSearchInput] = useState(initialSearch)

  // Sync searchInput mit URL
  useEffect(() => {
    setSearchInput(initialSearch)
  }, [initialSearch])

  // Build URL with filters
  const buildUrl = useCallback((
    q: string,
    status: string,
    category: string,
    page: number = 1
  ) => {
    const params = new URLSearchParams()
    
    if (q) params.set("q", q)
    if (status) params.set("status", status)
    if (category) params.set("category", category)
    if (page > 1) params.set("page", page.toString())

    const queryString = params.toString()
    return `/app/dpps${queryString ? `?${queryString}` : ""}`
  }, [])

  // Handle search with debounce
  useEffect(() => {
    if (searchInput === initialSearch) return

    const timer = setTimeout(() => {
      router.push(buildUrl(searchInput, initialStatus, initialCategory, 1))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput, initialSearch, initialStatus, initialCategory, buildUrl, router])

  // Handle filter changes (immediate) - schreibt direkt in URL
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    router.push(buildUrl(initialSearch, value, initialCategory, 1))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    router.push(buildUrl(initialSearch, initialStatus, value, 1))
  }

  // Handle filter removal
  const removeFilter = (type: "q" | "status" | "category") => {
    if (type === "q") {
      setSearchInput("")
      router.push(buildUrl("", initialStatus, initialCategory, 1))
    } else if (type === "status") {
      router.push(buildUrl(initialSearch, "", initialCategory, 1))
    } else if (type === "category") {
      router.push(buildUrl(initialSearch, initialStatus, "", 1))
    }
  }

  const hasActiveFilters = !!(initialSearch || initialStatus || initialCategory)

  return (
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
        marginBottom: hasActiveFilters ? "1rem" : "0"
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
              boxSizing: "border-box",
              minHeight: "44px",
              lineHeight: "1.5"
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
            value={initialStatus}
            onChange={handleStatusChange}
            style={{
              width: "100%",
              padding: "0.75rem 2.5rem 0.75rem 0.75rem",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              fontSize: "1rem",
              backgroundColor: "#FFFFFF",
              boxSizing: "border-box",
              minHeight: "44px",
              lineHeight: "1.5",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center"
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
            value={initialCategory}
            onChange={handleCategoryChange}
            style={{
              width: "100%",
              padding: "0.75rem 2.5rem 0.75rem 0.75rem",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              fontSize: "1rem",
              backgroundColor: "#FFFFFF",
              boxSizing: "border-box",
              minHeight: "44px",
              lineHeight: "1.5",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center"
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
      {hasActiveFilters && (
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
          {initialSearch && (
            <button
              onClick={() => removeFilter("q")}
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
              Suche: "{initialSearch}"
              <span>×</span>
            </button>
          )}
          {initialStatus && (
            <button
              onClick={() => removeFilter("status")}
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
              Status: {initialStatus === "DRAFT" ? "Entwurf" : "Veröffentlicht"}
              <span>×</span>
            </button>
          )}
          {initialCategory && (
            <button
              onClick={() => removeFilter("category")}
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
              Kategorie: {initialCategory === "TEXTILE" ? "Textil" : initialCategory === "FURNITURE" ? "Möbel" : "Sonstiges"}
              <span>×</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
