"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface FeatureFilterBarProps {
  availableCategories: string[];
  currentFilters: {
    category: string;
    minimumPlan: string;
    status: string;
  };
}

/**
 * Feature Filter Bar Component
 * 
 * Reuses the exact same pattern as DPP FilterBar
 * URL-based filtering - updates URL params, triggers server-side re-render
 */
export default function FeatureFilterBar({
  availableCategories,
  currentFilters,
}: FeatureFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`/super-admin/feature-registry?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    updateURL({ category: value || null });
  };

  const handlePlanChange = (value: string) => {
    updateURL({ minimumPlan: value || null });
  };

  const handleStatusChange = (value: string) => {
    updateURL({ status: value || null });
  };

  const handleClearFilters = () => {
    router.push("/super-admin/feature-registry");
  };

  const hasActiveFilters =
    currentFilters.category || currentFilters.minimumPlan || currentFilters.status;

  const categoryLabels: Record<string, string> = {
    core: "Kern",
    content: "Inhalt",
    interaction: "Interaktion",
    styling: "Gestaltung",
    publishing: "Veröffentlichung",
    system: "System",
  };

  const planLabels: Record<string, string> = {
    basic: "Basic",
    pro: "Pro",
    premium: "Premium",
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
          alignItems: "end",
        }}
        className="feature-filter-form"
      >
      <style jsx>{`
        @media (max-width: 768px) {
          .feature-filter-form {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        {/* Category Filter */}
        <div style={{ minWidth: "150px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "0.5rem",
            }}
          >
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
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237A7A7A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "20px 20px",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#24c598";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">Alle</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabels[cat] || cat}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Plan Filter */}
        <div style={{ minWidth: "150px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "0.5rem",
            }}
          >
            Mindest-Tarif
          </label>
          <select
            value={currentFilters.minimumPlan}
            onChange={(e) => handlePlanChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 2rem 0.625rem 0.75rem",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "0.875rem",
              boxSizing: "border-box",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237A7A7A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "20px 20px",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#24c598";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">Alle</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: "150px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "0.5rem",
            }}
          >
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
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237A7A7A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "20px 20px",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#24c598";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">Alle</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
          </select>
        </div>

        {/* Clear Filters Button */}
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
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (hasActiveFilters) {
                e.currentTarget.style.backgroundColor = "#F9FAFB";
                e.currentTarget.style.borderColor = "#9CA3AF";
              }
            }}
            onMouseLeave={(e) => {
              if (hasActiveFilters) {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.borderColor = "#D1D5DB";
              }
            }}
          >
            Zurücksetzen
          </button>
        </div>
      </form>
    </div>
  );
}

