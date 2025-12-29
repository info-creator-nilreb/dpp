"use client"

/**
 * Super Admin Audit Logs Client Component
 * 
 * Platform-wide audit log view with full access including system events
 */

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useNotification } from "@/components/NotificationProvider"
import AuditLogTable from "../../app/audit-logs/AuditLogTable"
import AuditLogFilters from "../../app/audit-logs/AuditLogFilters"
import AuditLogDetailDrawer from "../../app/audit-logs/AuditLogDetailDrawer"
import { getActionTypeOptions, getEntityTypeOptions, getSourceOptions } from "@/lib/audit/audit-labels"

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

interface SuperAdminAuditLogsClientProps {
  organizationId?: string
  dppId?: string
  initialPage?: number
  initialLimit?: number
}

export default function SuperAdminAuditLogsClient({
  organizationId,
  dppId,
  initialPage = 1,
  initialLimit = 50,
}: SuperAdminAuditLogsClientProps) {
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
  const [complianceOnly, setComplianceOnly] = useState<boolean>(false)
  const [includeAIEvents, setIncludeAIEvents] = useState<boolean>(true)
  const [includeSystemEvents, setIncludeSystemEvents] = useState<boolean>(true)

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
    includeSystemEvents,
    dppId,
    organizationId,
  ])

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (organizationId) params.set("organizationId", organizationId)
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
      // Super Admin: include system events by default
      if (includeSystemEvents) {
        // System events are included by default for super admins
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Audit Logs")
      }

      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      showNotification("Fehler beim Laden der Audit Logs. Bitte versuchen Sie es erneut.", "error")
      setError("Audit Logs konnten nicht geladen werden. Mögliche Gründe sind fehlende Berechtigungen, keine verfügbaren Daten oder ein temporäres Systemproblem.")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: "csv" | "json") => {
    try {
      const params = new URLSearchParams()
      if (organizationId) params.set("organizationId", organizationId)
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
      a.download = `audit-logs-platform-${new Date().toISOString().split("T")[0]}.${format}`
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
    <div style={{
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      overflowX: "hidden"
    }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/super-admin/dashboard"
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
          Plattform Audit Log
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "1rem"
        }}>
          Vollständige, unveränderliche Historie aller Aktionen plattformweit (inkl. System-Events)
        </p>
        <div style={{
          marginTop: "1rem",
          padding: "0.75rem 1rem",
          backgroundColor: "#FEF3C7",
          border: "1px solid #FCD34D",
          borderRadius: "8px",
          fontSize: "0.875rem",
          color: "#92400E"
        }}>
          <strong>Super Admin Zugriff:</strong> Sie sehen alle Audit Logs plattformweit, einschließlich System-Events und IP-Adressen.
        </div>
      </div>

      {/* Actions - Desktop only (Super Admin: no mobile view) */}
      <div style={{
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

      {/* Filters */}
      <div style={{
        backgroundColor: "#F9F9F9",
        padding: "1.5rem",
        borderRadius: "8px",
        border: "1px solid #E5E5E5",
        marginBottom: "1.5rem",
        position: "sticky",
        top: "1rem",
        zIndex: 10,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
          minWidth: 0
        }}>
          {/* Date Range */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: "#0A0A0A" }}>
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
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: "#0A0A0A" }}>
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

          {/* Entity Type */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: "#0A0A0A" }}>
              Objekttyp
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
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
              {getEntityTypeOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: "#0A0A0A" }}>
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

          {/* Source */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: "#0A0A0A" }}>
              Quelle
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
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
              {getSourceOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Toggles - Outside of grid to ensure horizontal layout */}
        <div style={{ 
          display: "flex", 
          flexDirection: "row", 
          gap: "1.5rem", 
          justifyContent: "flex-end", 
          alignItems: "center", 
          flexWrap: "wrap",
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid #E5E5E5"
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              checked={complianceOnly}
              onChange={(e) => setComplianceOnly(e.target.checked)}
              style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
            />
            <span style={{ fontSize: "0.875rem", color: "#0A0A0A" }}>Nur compliance-relevant</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              checked={includeAIEvents}
              onChange={(e) => setIncludeAIEvents(e.target.checked)}
              style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
            />
            <span style={{ fontSize: "0.875rem", color: "#0A0A0A" }}>KI-Ereignisse einbeziehen</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              checked={includeSystemEvents}
              onChange={(e) => setIncludeSystemEvents(e.target.checked)}
              style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
            />
            <span style={{ fontSize: "0.875rem", color: "#0A0A0A" }}>Systemereignisse einbeziehen</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <AuditLogTable
        logs={logs}
        loading={loading}
        onRowClick={(log) => setSelectedLog(log)}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        onLimitChange={(limit) => setPagination({ ...pagination, limit, page: 1 })}
      />

      {/* Detail Drawer */}
      {selectedLog && (
        <AuditLogDetailDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  )
}

