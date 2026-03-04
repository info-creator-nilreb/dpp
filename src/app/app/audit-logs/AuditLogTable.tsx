"use client"

/**
 * Audit Log Table Component
 */

import { AuditLog } from "./AuditLogsClient"
import { getActionLabel, getEntityLabel } from "@/lib/audit/audit-labels"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import Pagination from "@/components/ui/Pagination"

interface AuditLogTableProps {
  logs: AuditLog[]
  loading: boolean
  onRowClick: (log: AuditLog) => void
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function AuditLogTable({
  logs,
  loading,
  onRowClick,
  pagination,
  onPageChange,
  onLimitChange,
}: AuditLogTableProps) {
  const getActionBadgeColor = (actionType: string) => {
    if (actionType.startsWith("AI_")) {
      return "#24c598" // AI actions: pink
    }
    if (["CREATE", "PUBLISH"].includes(actionType)) {
      return "#10B981" // Positive actions: green
    }
    if (["DELETE", "ARCHIVE"].includes(actionType)) {
      return "#EF4444" // Destructive actions: red
    }
    return "#6B7280" // Default: gray
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <LoadingSpinner message="Audit Logs werden geladen …" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#7A7A7A" }}>
        <div style={{ marginBottom: "0.5rem" }}>Keine Audit Logs gefunden</div>
        <div style={{ fontSize: "0.875rem", color: "#9A9A9A" }}>
          Für den gewählten Zeitraum oder die gesetzten Filter liegen keine Einträge vor.
        </div>
      </div>
    )
  }

  return (
    <div className="audit-log-table-container" style={{
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
    }}>
      {/* Total count above table header */}
      <div style={{ color: "#7A7A7A", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
        {pagination.total} Einträge
      </div>
      {/* Desktop Table – feste Spaltenbreiten, passt bei ausgeklappter Sidebar ohne horizontales Scrollen */}
      <div
        className="audit-log-table-desktop"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid #E5E5E5",
          overflow: "hidden",
          display: "none",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "18%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "32%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #E5E5E5" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Zeit</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Ausführende Person</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Aktion</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Objekt</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onRowClick(log)}
                style={{
                  borderBottom: "1px solid #E5E5E5",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F9F9F9"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF"
                }}
              >
                <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#0A0A0A", fontFamily: "inherit" }}>
                  {formatTimestamp(log.timestamp)}
                </td>
                <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#0A0A0A" }}>
                  {log.actor?.name || log.actor?.email || log.actor?.id || "SYSTEM"}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#FFFFFF",
                      backgroundColor: getActionBadgeColor(log.actionType)
                    }}>
                      {getActionLabel(log.actionType)}
                    </span>
                    {log.complianceRelevant && (
                      <span style={{
                        display: "inline-block",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.6875rem",
                        fontWeight: "600",
                        color: "#92400E",
                        backgroundColor: "#FEF3C7",
                        border: "1px solid #FCD34D"
                      }}>
                        Compliance-relevant
                      </span>
                    )}
                    {log.source === "AI" && (
                      <span style={{
                        display: "inline-block",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.6875rem",
                        fontWeight: "600",
                        color: "#FFFFFF",
                        backgroundColor: "#24c598"
                      }}>
                        KI-unterstützt
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#0A0A0A" }}>
                  {getEntityLabel(log.entityType)} {log.entityId ? `(${log.entityId.substring(0, 8)}...)` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={[10, 25, 50, 100].includes(pagination.limit) ? pagination.limit : 25}
        onPageChange={onPageChange}
        onPageSizeChange={(size) => onLimitChange(size)}
      />

      {/* Mobile View - Hidden on desktop */}
      <div className="audit-log-table-mobile" style={{ display: "none" }}>
        {/* Mobile view will be rendered by parent component */}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .audit-log-table-desktop {
            display: block !important;
          }
          .audit-log-table-mobile {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .audit-log-table-desktop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

