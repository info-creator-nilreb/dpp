"use client"

/**
 * Audit Log Mobile View Component
 * 
 * Card-based list view for mobile devices
 */

import { AuditLog } from "./AuditLogsClient"
import AuditLogCard from "./AuditLogCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import Pagination from "@/components/ui/Pagination"

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
  onLimitChange?: (limit: number) => void
}

export default function AuditLogMobileView({
  logs,
  loading,
  onCardClick,
  pagination,
  onPageChange,
  onLimitChange,
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

  const pageSize = [10, 25, 50, 100].includes(pagination.limit) ? pagination.limit : 25

  return (
    <div>
      <div style={{ color: "#7A7A7A", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
        {pagination.total} Einträge
      </div>
      <div>
        {logs.map((log) => (
          <AuditLogCard
            key={log.id}
            log={log}
            onClick={() => onCardClick(log)}
          />
        ))}
      </div>
      {onLimitChange ? (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onLimitChange}
        />
      ) : (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={() => {}}
        />
      )}
    </div>
  )
}


