"use client"

import { useState, useEffect } from "react"
import ChevronIcon from "@/components/dashboard/ChevronIcon"
import { BREAKPOINTS_MQ } from "@/lib/breakpoints"

/* Premium Analytics KPI-Styles (Shopify-inspiriert) */
const statsCardKpiZone: React.CSSProperties = {
  marginTop: 16,
}

const statsKpiValue: React.CSSProperties = {
  fontSize: 44,
  fontWeight: 600,
  lineHeight: 1.05,
  letterSpacing: "-0.5px",
  color: "#0f172a",
}

const statsKpiMeta: React.CSSProperties = {
  marginTop: 12,
  fontSize: 15,
  color: "#6B7280",
}

const statsKpiGrowth: React.CSSProperties = {
  color: "#059669",
  fontWeight: 500,
}

export interface StatsAnalysisCardProps {
  /** Für Accordion: Eindeutige ID (Mobile: nur eine Card offen) */
  cardId?: string
  title: string
  /** Icon vor dem Titel (z. B. 📊 oder 💬) */
  icon?: React.ReactNode
  /** Haupt-KPI (große Zahl) */
  kpiValue: React.ReactNode
  /** Meta-Zeile unter dem KPI */
  kpiMeta?: React.ReactNode
  /** Optional: Prozentuale Änderung inkl. Referenz (z. B. "+18 % vs. Vormonat") */
  kpiGrowth?: React.ReactNode
  /** Detail-Bereich (expanded) */
  expandedContent: React.ReactNode
  defaultExpanded?: boolean
  /** Kontrollierter Modus (Mobile Accordion): von Parent gesteuert */
  expanded?: boolean
  onToggle?: () => void
}

/**
 * Card-basiertes Analyse-Modul für die Statistik-Seite.
 * Premium-Analytics-Hierarchie: Header → KPI-Zone → Detail-Zone.
 */
export default function StatsAnalysisCard({
  cardId,
  title,
  icon,
  kpiValue,
  kpiMeta,
  kpiGrowth,
  expandedContent,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
}: StatsAnalysisCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const [isMobile, setIsMobile] = useState(false)

  const isControlled = controlledExpanded !== undefined && onToggle != null
  const expanded = isControlled ? controlledExpanded : internalExpanded
  const handleClick = () => {
    if (isControlled) onToggle?.()
    else setInternalExpanded((prev) => !prev)
  }

  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.appMobile)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <div
      className="stats-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-expanded={expanded}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        overflow: "hidden",
        padding: isMobile ? 20 : 32,
        transition: "border-color 200ms, box-shadow 200ms",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#cbd5e1"
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E5E7EB"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#0f172a",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {icon != null && <span style={{ color: "#6B7280", fontSize: 16 }}>{icon}</span>}
          {title}
        </h3>
        <span style={{ color: "#94a3b8", display: "flex", alignItems: "center" }}>
          <ChevronIcon expanded={expanded} size={18} />
        </span>
      </div>

      <div style={{ padding: 0 }}>
        <div
          style={{
            ...statsCardKpiZone,
            ...(isMobile ? { marginTop: 16, marginBottom: 20 } : {}),
          }}
          className="stats-card-kpi-zone kpi-number-wrapper"
        >
          <div
            className="kpi-number"
            style={{
              ...statsKpiValue,
              ...(isMobile ? { fontSize: 40, fontWeight: 700, marginBottom: 12 } : {}),
            }}
          >
            {kpiValue}
          </div>
          {(kpiMeta != null || kpiGrowth != null) && (
            <div
              className="kpi-meta"
              style={{
                ...statsKpiMeta,
                ...(isMobile ? { fontSize: 14, marginBottom: 20 } : {}),
              }}
            >
              {kpiMeta}
              {kpiGrowth != null && (
                <span style={{ ...statsKpiGrowth, marginLeft: kpiMeta ? 8 : 0 }}>
                  {kpiGrowth}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className="stats-divider accordion-content"
          style={{
            marginTop: isMobile ? 20 : 28,
            overflow: "hidden",
            maxHeight: expanded ? 2000 : 0,
            opacity: expanded ? 1 : 0,
            transition: "height 0.25s ease, max-height 0.25s ease, opacity 0.2s ease",
            borderTop: expanded ? "1px solid #E5E7EB" : "none",
            paddingTop: expanded ? (isMobile ? 16 : 32) : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {expandedContent}
        </div>
      </div>
    </div>
  )
}
