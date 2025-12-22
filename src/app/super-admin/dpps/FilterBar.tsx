"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface Organization {
  id: string
  name: string
}

interface FilterBarProps {
  organizations: Organization[]
  availableCategories: string[]
  availableStatuses: string[]
  currentFilters: {
    q: string
    organizationId: string
    category: string
    status: string
  }
}

/**
 * Filter Bar Component
 * 
 * URL-based filtering - updates URL params, triggers server-side re-render
 */
export default function FilterBar({
  organizations,
  availableCategories,
  availableStatuses,
  currentFilters
}: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(currentFilters.q)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Update local state when filters change (from URL)
  useEffect(() => {
    setSearchQuery(currentFilters.q)
  }, [currentFilters.q])

  // Debounced search suggestions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/super-admin/dpps/suggestions?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    router.push(`/super-admin/dpps?${params.toString()}`)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Update URL immediately (debounced suggestions fetch is separate)
    updateURL({ q: value || null })
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    updateURL({ q: suggestion })
  }

  const handleOrganizationChange = (value: string) => {
    updateURL({ organizationId: value || null })
  }

  const handleCategoryChange = (value: string) => {
    updateURL({ category: value || null })
  }

  const handleStatusChange = (value: string) => {
    updateURL({ status: value || null })
  }

  const handleClearFilters = () => {
    router.push("/super-admin/dpps")
  }

  const hasActiveFilters = currentFilters.q || currentFilters.organizationId || currentFilters.category || currentFilters.status

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      padding: "1.5rem",
      marginBottom: "1.5rem",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
    }}>
      <form onSubmit={(e) => e.preventDefault()} style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto auto auto auto",
        gap: "1rem",
        alignItems: "end"
      }}>
        {/* Search Input with Autocomplete */}
        <div style={{ position: "relative" }}>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#374151",
            marginBottom: "0.5rem"
          }}>
            Suche
          </label>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Name, Marke..."
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "0.875rem",
              boxSizing: "border-box",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#E20074"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB"
              e.currentTarget.style.boxShadow = "none"
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                marginTop: "0.25rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                zIndex: 1000,
                maxHeight: "200px",
                overflowY: "auto"
              }}
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    textAlign: "left",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "#374151",
                    transition: "background-color 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Organization Filter */}
        <div style={{ minWidth: "180px" }}>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#374151",
            marginBottom: "0.5rem"
          }}>
            Organisation
          </label>
          <select
            value={currentFilters.organizationId}
            onChange={(e) => handleOrganizationChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 2rem 0.625rem 0.75rem",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "0.875rem",
              boxSizing: "border-box",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#E20074"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <option value="">Alle</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div style={{ minWidth: "150px" }}>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#374151",
            marginBottom: "0.5rem"
          }}>
            Kategorie
          </label>
          <select
            value={currentFilters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 2rem 0.625rem 0.75rem",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "0.875rem",
              boxSizing: "border-box",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#E20074"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <option value="">Alle</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "TEXTILE" ? "Textilien" : cat === "FURNITURE" ? "Möbel" : cat === "OTHER" ? "Sonstige" : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: "150px" }}>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#374151",
            marginBottom: "0.5rem"
          }}>
            Status
          </label>
          <select
            value={currentFilters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 2rem 0.625rem 0.75rem",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "0.875rem",
              boxSizing: "border-box",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#E20074"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <option value="">Alle</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button - Always visible but disabled when no filters */}
        <div style={{ minWidth: "140px", display: "flex", alignItems: "flex-end" }}>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            style={{
              width: "100%",
              padding: "0.625rem 1rem",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              backgroundColor: hasActiveFilters ? "#FFFFFF" : "#F9FAFB",
              color: hasActiveFilters ? "#374151" : "#9CA3AF",
              cursor: hasActiveFilters ? "pointer" : "not-allowed",
              fontSize: "0.875rem",
              fontWeight: "500",
              transition: "all 0.2s",
              outline: "none"
            }}
            onMouseEnter={(e) => {
              if (hasActiveFilters) {
                e.currentTarget.style.backgroundColor = "#F9FAFB"
                e.currentTarget.style.borderColor = "#9CA3AF"
              }
            }}
            onMouseLeave={(e) => {
              if (hasActiveFilters) {
                e.currentTarget.style.backgroundColor = "#FFFFFF"
                e.currentTarget.style.borderColor = "#D1D5DB"
              }
            }}
          >
            Zurücksetzen
          </button>
        </div>
      </form>
    </div>
  )
}

