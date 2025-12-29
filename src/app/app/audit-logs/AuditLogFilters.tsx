"use client"

/**
 * Audit Log Filters Component
 */

import { getActionTypeOptions, getEntityTypeOptions, getSourceOptions } from "@/lib/audit/audit-labels"

interface AuditLogFiltersProps {
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  entityType: string
  setEntityType: (type: string) => void
  actionType: string
  setActionType: (type: string) => void
  actorId: string
  setActorId: (id: string) => void
  source: string
  setSource: (source: string) => void
  complianceOnly: boolean
  setComplianceOnly: (value: boolean) => void
  includeAIEvents: boolean
  setIncludeAIEvents: (value: boolean) => void
}

export default function AuditLogFilters({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  entityType,
  setEntityType,
  actionType,
  setActionType,
  actorId,
  setActorId,
  source,
  setSource,
  complianceOnly,
  setComplianceOnly,
  includeAIEvents,
  setIncludeAIEvents,
}: AuditLogFiltersProps) {
  const entityTypeOptions = getEntityTypeOptions()
  const actionTypeOptions = getActionTypeOptions()
  const sourceOptions = getSourceOptions()

  return (
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
        boxSizing: "border-box"
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
            {entityTypeOptions.map((option) => (
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
            {actionTypeOptions.map((option) => (
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
            {sourceOptions.map((option) => (
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
      </div>
    </div>
  )
}

