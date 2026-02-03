"use client"

/**
 * Mobile Audit Log Filters Component
 * 
 * Collapsible filter section for mobile
 */

import { useState } from "react"
import { getActionTypeOptions, getEntityTypeOptions } from "@/lib/audit/audit-labels"

interface AuditLogMobileFiltersProps {
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  actionType: string
  setActionType: (type: string) => void
  complianceOnly: boolean
  setComplianceOnly: (value: boolean) => void
  includeAIEvents: boolean
  setIncludeAIEvents: (value: boolean) => void
}

export default function AuditLogMobileFilters({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  actionType,
  setActionType,
  complianceOnly,
  setComplianceOnly,
  includeAIEvents,
  setIncludeAIEvents,
}: AuditLogMobileFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Date presets
  const setDatePreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(start.toISOString().split("T")[0])
    setEndDate(end.toISOString().split("T")[0])
  }

  return (
    <div style={{
      backgroundColor: "#F9F9F9",
      borderRadius: "8px",
      border: "1px solid #E5E5E5",
      marginBottom: "1.5rem",
      overflow: "hidden"
    }}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          padding: "1rem",
          backgroundColor: "transparent",
          border: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        <span style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A"
        }}>
          Filter
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: "#7A7A7A",
            flexShrink: 0,
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s"
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div style={{
          padding: "0 1rem 1rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          {/* Date Presets */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.8125rem",
              fontWeight: "500",
              color: "#0A0A0A"
            }}>
              Zeitraum
            </label>
            <div style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => setDatePreset(7)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #E5E5E5",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.8125rem",
                  cursor: "pointer"
                }}
              >
                Letzte 7 Tage
              </button>
              <button
                onClick={() => setDatePreset(30)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #E5E5E5",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.8125rem",
                  cursor: "pointer"
                }}
              >
                Letzte 30 Tage
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.8125rem",
              fontWeight: "500",
              color: "#0A0A0A"
            }}>
              Von Datum
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "100%",
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #E5E5E5",
                fontSize: "0.875rem",
                boxSizing: "border-box"
              }}
            />
          </div>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.8125rem",
              fontWeight: "500",
              color: "#0A0A0A"
            }}>
              Bis Datum
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "100%",
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #E5E5E5",
                fontSize: "0.875rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Action Type */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.8125rem",
              fontWeight: "500",
              color: "#0A0A0A"
            }}>
              Aktion
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "100%",
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #E5E5E5",
                fontSize: "0.875rem",
                boxSizing: "border-box"
              }}
            >
              <option value="">Alle</option>
              {getActionTypeOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={complianceOnly}
                onChange={(e) => setComplianceOnly(e.target.checked)}
                style={{ width: "1rem", height: "1rem" }}
              />
              <span style={{ fontSize: "0.875rem", color: "#0A0A0A" }}>
                Nur compliance-relevant
              </span>
            </label>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={includeAIEvents}
                onChange={(e) => setIncludeAIEvents(e.target.checked)}
                style={{ width: "1rem", height: "1rem" }}
              />
              <span style={{ fontSize: "0.875rem", color: "#0A0A0A" }}>
                KI-Ereignisse einbeziehen
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}


