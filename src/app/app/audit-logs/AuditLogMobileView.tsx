"use client"

/**
 * Audit Log Mobile View Component
 * 
 * Card-based list view for mobile devices
 */

import { AuditLog } from "./AuditLogsClient"
import AuditLogCard from "./AuditLogCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface AuditLogMobileViewProps {
  logs: AuditLog[]
  loading: boolean
  onCardClick: (log: AuditLog) => void
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
}

export default function AuditLogMobileView({
  logs,
  loading,
  onCardClick,
  pagination,
  onPageChange,
}: AuditLogMobileViewProps) {
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
    <div>
      {/* Card List */}
      <div>
        {logs.map((log) => (
          <AuditLogCard
            key={log.id}
            log={log}
            onClick={() => onCardClick(log)}
          />
        ))}
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
          {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} von {pagination.total}
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
            {pagination.page} / {pagination.totalPages}
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
        </div>
      </div>
    </div>
  )
}


