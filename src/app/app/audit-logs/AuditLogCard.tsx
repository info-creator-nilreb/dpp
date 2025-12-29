"use client"

/**
 * Audit Log Card Component (Mobile)
 * 
 * Card-based view for mobile devices
 */

import { AuditLog } from "./AuditLogsClient"
import { getActionLabel, getEntityLabel, getSourceLabel } from "@/lib/audit/audit-labels"

interface AuditLogCardProps {
  log: AuditLog
  onClick: () => void
}

export default function AuditLogCard({ log, onClick }: AuditLogCardProps) {
  const getActionBadgeColor = (actionType: string) => {
    if (actionType.startsWith("AI_")) {
      return "#E20074" // AI actions: pink
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
    })
  }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid #E5E5E5",
        padding: "1rem",
        marginBottom: "0.75rem",
        cursor: "pointer",
        transition: "background-color 0.2s, box-shadow 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#F9F9F9"
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#FFFFFF"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Header: Action Badge + Timestamp */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "0.75rem",
        gap: "0.5rem"
      }}>
        <span style={{
          display: "inline-block",
          padding: "0.375rem 0.625rem",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: "600",
          color: "#FFFFFF",
          backgroundColor: getActionBadgeColor(log.actionType)
        }}>
          {getActionLabel(log.actionType)}
        </span>
        <span style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          fontFamily: "monospace",
          whiteSpace: "nowrap"
        }}>
          {formatTimestamp(log.timestamp)}
        </span>
      </div>

      {/* Object Label */}
      <div style={{
        fontSize: "0.875rem",
        fontWeight: "500",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {getEntityLabel(log.entityType)}
        {log.entityId && (
          <span style={{ color: "#7A7A7A", fontWeight: "400" }}>
            {" "}({log.entityId.substring(0, 8)}...)
          </span>
        )}
      </div>

      {/* Actor (if available) */}
      {log.actor && (
        <div style={{
          fontSize: "0.8125rem",
          color: "#7A7A7A",
          marginBottom: "0.5rem"
        }}>
          {log.actor.name || log.actor.email}
        </div>
      )}

      {/* Badges: Compliance + AI */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap"
      }}>
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
            backgroundColor: "#E20074"
          }}>
            KI-unterstützt
          </span>
        )}
      </div>
    </div>
  )
}


