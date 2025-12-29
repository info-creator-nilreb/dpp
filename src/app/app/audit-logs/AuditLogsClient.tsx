"use client"

/**
 * Audit Logs Client Component
 * 
 * Handles filtering, pagination, and display of audit logs
 */

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useNotification } from "@/components/NotificationProvider"
import AuditLogTable from "./AuditLogTable"
import AuditLogFilters from "./AuditLogFilters"
import AuditLogDetailDrawer from "./AuditLogDetailDrawer"
import AuditLogMobileView from "./AuditLogMobileView"
import AuditLogMobileFilters from "./AuditLogMobileFilters"
import AuditLogMobileDetailSheet from "./AuditLogMobileDetailSheet"

interface AuditLog {
  id: string
  timestamp: string
  actor?: {
    id: string
    email: string
    name: string | null
  } | null
  actorRole: string | null
  organization?: {
    id: string
    name: string
  } | null
  actionType: string
  entityType: string
  entityId: string | null
  fieldName: string | null
  oldValue: any
  newValue: any
  source: string
  complianceRelevant: boolean
  versionId: string | null
  ipAddress: string | null
  metadata: any
  aiModel: string | null
  aiModelVersion: string | null
  aiPromptId: string | null
  aiInputSources: string[] | null
  aiConfidenceScore: number | null
  aiExplainabilityNote: string | null
  humanInTheLoop: boolean | null
  finalDecisionBy: string | null
  regulatoryImpact: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AuditLogsClientProps {
  organizationId: string
  dppId?: string
  initialPage?: number
  initialLimit?: number
}

export default function AuditLogsClient({
  organizationId,
  dppId,
  initialPage = 1,
  initialLimit = 50,
}: AuditLogsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showNotification } = useNotification()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Filters
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [entityType, setEntityType] = useState<string>("")
  const [actionType, setActionType] = useState<string>("")
  const [actorId, setActorId] = useState<string>("")
  const [source, setSource] = useState<string>("")
  const [complianceOnly, setComplianceOnly] = useState<boolean>(true)
  const [includeAIEvents, setIncludeAIEvents] = useState<boolean>(true)

  useEffect(() => {
    loadLogs()
  }, [
    pagination.page,
    pagination.limit,
    startDate,
    endDate,
    entityType,
    actionType,
    actorId,
    source,
    complianceOnly,
    includeAIEvents,
    dppId,
  ])

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("organizationId", organizationId)
      if (dppId) params.set("dppId", dppId)
      params.set("page", pagination.page.toString())
      params.set("limit", pagination.limit.toString())
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
      if (entityType) params.set("entityType", entityType)
      if (actionType) params.set("actionType", actionType)
      if (actorId) params.set("actorId", actorId)
      if (source) params.set("source", source)
      if (complianceOnly) params.set("complianceOnly", "true")
      if (!includeAIEvents) params.set("includeAIEvents", "false")

      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Audit Logs")
      }

      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      setError("Audit Logs konnten nicht geladen werden. Mögliche Gründe sind fehlende Berechtigungen, keine verfügbaren Daten oder ein temporäres Systemproblem.")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: "csv" | "json") => {
    try {
      const params = new URLSearchParams()
      params.set("organizationId", organizationId)
      if (dppId) params.set("dppId", dppId)
      params.set("export", format)
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
      if (entityType) params.set("entityType", entityType)
      if (actionType) params.set("actionType", actionType)
      if (actorId) params.set("actorId", actorId)
      if (source) params.set("source", source)
      if (complianceOnly) params.set("complianceOnly", "true")
      if (!includeAIEvents) params.set("includeAIEvents", "false")

      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Fehler beim Export")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showNotification("Export erfolgreich erstellt", "success")
    } catch (error) {
      console.error("Error exporting audit logs:", error)
      showNotification("Fehler beim Export der Audit Logs", "error")
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.85rem, 2vw, 0.9rem)"
          }}
        >
          ← Zum Dashboard
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Audit Log
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "1rem"
        }}>
          Unveränderliche Historie aller Compliance-relevanten und KI-gestützten Aktionen
        </p>
      </div>

      {/* Actions - Desktop only */}
      <div className="audit-log-actions-desktop" style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "1.5rem",
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => handleExport("csv")}
          style={{
            backgroundColor: "#F5F5F5",
            color: "#0A0A0A",
            padding: "0.625rem 1rem",
            borderRadius: "8px",
            border: "1px solid #E5E5E5",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500"
          }}
        >
          Export CSV
        </button>
        <button
          onClick={() => handleExport("json")}
          style={{
            backgroundColor: "#F5F5F5",
            color: "#0A0A0A",
            padding: "0.625rem 1rem",
            borderRadius: "8px",
            border: "1px solid #E5E5E5",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500"
          }}
        >
          Export JSON
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: "1rem 1.5rem",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#991B1B"
        }}>
          <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
            Audit Logs konnten nicht geladen werden
          </div>
          <div style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
            Mögliche Gründe sind fehlende Berechtigungen, keine verfügbaren Daten oder ein temporäres Systemproblem.
          </div>
          <button
            onClick={() => loadLogs()}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="audit-log-filters-desktop">
        <AuditLogFilters
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          entityType={entityType}
          setEntityType={setEntityType}
          actionType={actionType}
          setActionType={setActionType}
          actorId={actorId}
          setActorId={setActorId}
          source={source}
          setSource={setSource}
          complianceOnly={complianceOnly}
          setComplianceOnly={setComplianceOnly}
          includeAIEvents={includeAIEvents}
          setIncludeAIEvents={setIncludeAIEvents}
        />
      </div>

      {/* Mobile Filters */}
      <div className="audit-log-filters-mobile" style={{ display: "none" }}>
        <AuditLogMobileFilters
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          actionType={actionType}
          setActionType={setActionType}
          complianceOnly={complianceOnly}
          setComplianceOnly={setComplianceOnly}
          includeAIEvents={includeAIEvents}
          setIncludeAIEvents={setIncludeAIEvents}
        />
      </div>

      {/* Desktop Table */}
      <div className="audit-log-table-desktop-wrapper">
        <AuditLogTable
          logs={logs}
          loading={loading}
          onRowClick={(log) => setSelectedLog(log)}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          onLimitChange={(limit) => setPagination({ ...pagination, limit, page: 1 })}
        />
      </div>

      {/* Mobile View */}
      <div className="audit-log-mobile-wrapper" style={{ display: "none" }}>
        <AuditLogMobileView
          logs={logs}
          loading={loading}
          onCardClick={(log) => setSelectedLog(log)}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
        />
      </div>

      {/* Desktop Detail Drawer */}
      <div className="audit-log-drawer-desktop">
        {selectedLog && (
          <AuditLogDetailDrawer
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        )}
      </div>

      {/* Mobile Detail Sheet */}
      <div className="audit-log-sheet-mobile" style={{ display: "none" }}>
        {selectedLog && (
          <AuditLogMobileDetailSheet
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        )}
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (min-width: 768px) {
          .audit-log-actions-desktop {
            display: flex !important;
          }
          .audit-log-filters-desktop {
            display: block !important;
          }
          .audit-log-filters-mobile {
            display: none !important;
          }
          .audit-log-table-desktop-wrapper {
            display: block !important;
          }
          .audit-log-mobile-wrapper {
            display: none !important;
          }
          .audit-log-drawer-desktop {
            display: block !important;
          }
          .audit-log-sheet-mobile {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .audit-log-actions-desktop {
            display: none !important;
          }
          .audit-log-filters-desktop {
            display: none !important;
          }
          .audit-log-filters-mobile {
            display: block !important;
          }
          .audit-log-table-desktop-wrapper {
            display: none !important;
          }
          .audit-log-mobile-wrapper {
            display: block !important;
          }
          .audit-log-drawer-desktop {
            display: none !important;
          }
          .audit-log-sheet-mobile {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}

