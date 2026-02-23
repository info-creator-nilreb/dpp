"use client"

import { useState } from "react"
import ChevronIcon from "@/components/dashboard/ChevronIcon"

export interface AnalysisModuleProps {
  title: string
  previewContent: React.ReactNode
  expandedContent: React.ReactNode
  defaultExpanded?: boolean
  /** false = erstes Modul (keine Border), true = folgende Module (Border davor) */
  hasTopBorder?: boolean
}

/**
 * Expandierbares Analyse-Modul für die Statistik-Seite.
 * Standardmäßig collapsed, zeigt Preview-Kennzahlen.
 */
export default function AnalysisModule({
  title,
  previewContent,
  expandedContent,
  defaultExpanded = false,
  hasTopBorder = false,
}: AnalysisModuleProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const moduleStyle: React.CSSProperties = hasTopBorder
    ? {
        borderTop: "1px solid #E5E7EB",
        paddingTop: 48,
        marginTop: 56,
      }
    : {
        marginTop: 48,
      }

  return (
    <div className="analysis-module" style={moduleStyle}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="analysis-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
          textAlign: "left",
          font: "inherit",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#0A0A0A",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <span
          style={{
            color: "#7A7A7A",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronIcon expanded={expanded} size={18} />
        </span>
      </button>

      <div
        className="analysis-preview"
        style={{
          marginTop: 16,
          color: "#374151",
          fontSize: "0.95rem",
        }}
      >
        {previewContent}
      </div>

      <div
        className="analysis-expanded"
        style={{
          marginTop: 32,
          overflow: "hidden",
          maxHeight: expanded ? 2000 : 0,
          opacity: expanded ? 1 : 0,
          transition: "max-height 0.3s ease, opacity 0.2s ease",
        }}
      >
        {expandedContent}
      </div>
    </div>
  )
}
