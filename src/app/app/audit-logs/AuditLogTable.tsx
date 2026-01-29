"use client"

/**
 * Audit Log Table Component
 */

import { AuditLog } from "./AuditLogsClient"
import { getActionLabel, getEntityLabel, getSourceLabel } from "@/lib/audit/audit-labels"
import { LoadingSpinner } from "@/components/LoadingSpinner"

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

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "AI":
        return "#24c598"
      case "SYSTEM":
        return "#6B7280"
      case "API":
        return "#3B82F6"
      default:
        return "#10B981"
    }
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

  const truncateValue = (value: any, maxLength: number = 50) => {
    if (!value) return "-"
    const str = typeof value === "string" ? value : JSON.stringify(value)
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str
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
      overflowX: "auto"
    }}>
      {/* Desktop Table */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid #E5E5E5",
        overflow: "hidden",
        display: "none",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box"
      }}
      className="audit-log-table-desktop"
      >
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #E5E5E5" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Zeit</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Ausführende Person</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Aktion</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Objekt</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Feld</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Änderung</th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A" }}>Quelle</th>
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
                <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#0A0A0A", fontFamily: "monospace" }}>
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
                <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#7A7A7A" }}>
                  {log.fieldName || "-"}
                </td>
                <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#0A0A0A", fontFamily: "monospace", maxWidth: "200px" }}>
                  {log.oldValue && log.newValue ? (
                    <span>
                      <span style={{ color: "#EF4444" }}>{truncateValue(log.oldValue)}</span>
                      {" → "}
                      <span style={{ color: "#10B981" }}>{truncateValue(log.newValue)}</span>
                    </span>
                  ) : log.newValue ? (
                    <span style={{ color: "#10B981" }}>{truncateValue(log.newValue)}</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    backgroundColor: getSourceBadgeColor(log.source)
                  }}>
                    {getSourceLabel(log.source)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "1.5rem",
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        <div style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>
          Zeige {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} von {pagination.total}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid #E5E5E5",
              backgroundColor: pagination.page === 1 ? "#F5F5F5" : "#FFFFFF",
              color: pagination.page === 1 ? "#7A7A7A" : "#0A0A0A",
              cursor: pagination.page === 1 ? "not-allowed" : "pointer",
              fontSize: "0.875rem"
            }}
          >
            Zurück
          </button>
          <span style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>
            Seite {pagination.page} von {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid #E5E5E5",
              backgroundColor: pagination.page >= pagination.totalPages ? "#F5F5F5" : "#FFFFFF",
              color: pagination.page >= pagination.totalPages ? "#7A7A7A" : "#0A0A0A",
              cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
              fontSize: "0.875rem"
            }}
          >
            Weiter
          </button>
          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value))}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #E5E5E5",
              fontSize: "0.875rem"
            }}
          >
            <option value="25">25 pro Seite</option>
            <option value="50">50 pro Seite</option>
            <option value="100">100 pro Seite</option>
            <option value="200">200 pro Seite</option>
          </select>
        </div>
      </div>

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

