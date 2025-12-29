"use client"

/**
 * Mobile Audit Log Detail Sheet
 * 
 * Bottom sheet overlay for mobile detail view
 * Readable text form, no raw JSON
 */

import { AuditLog } from "./AuditLogsClient"
import { getActionLabel, getEntityLabel, getSourceLabel } from "@/lib/audit/audit-labels"

interface AuditLogMobileDetailSheetProps {
  log: AuditLog
  onClose: () => void
}

export default function AuditLogMobileDetailSheet({
  log,
  onClose,
}: AuditLogMobileDetailSheetProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    })
  }

  const formatValue = (value: any): string => {
    if (!value) return "-"
    if (typeof value === "string") return value
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
        }}
      />

      {/* Bottom Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "90vh",
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.15)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Handle */}
        <div style={{
          padding: "0.75rem",
          display: "flex",
          justifyContent: "center",
          borderBottom: "1px solid #E5E5E5"
        }}>
          <div style={{
            width: "40px",
            height: "4px",
            backgroundColor: "#CDCDCD",
            borderRadius: "2px"
          }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #E5E5E5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#0A0A0A",
            margin: 0,
          }}>
            Details
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "1.5rem",
              color: "#7A7A7A",
            }}
          >
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div style={{
          padding: "1.5rem",
          overflowY: "auto",
          flex: 1
        }}>
          {/* Summary */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.75rem",
            }}>
              Zusammenfassung
            </h3>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}>
              <div>
                <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Zeit:</strong>{" "}
                <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>{formatTimestamp(log.timestamp)}</span>
              </div>
              <div>
                <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Aktion:</strong>{" "}
                <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>{getActionLabel(log.actionType)}</span>
              </div>
              <div>
                <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Objekt:</strong>{" "}
                <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>{getEntityLabel(log.entityType)}</span>
              </div>
              <div>
                <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Quelle:</strong>{" "}
                <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>{getSourceLabel(log.source)}</span>
              </div>
              {log.complianceRelevant && (
                <div>
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
                </div>
              )}
            </div>
          </section>

          {/* Changes */}
          {(log.oldValue || log.newValue) && (
            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.75rem",
              }}>
                Änderungen
              </h3>
              <div style={{
                backgroundColor: "#F9F9F9",
                padding: "1rem",
                borderRadius: "8px",
                fontSize: "0.875rem",
              }}>
                {log.oldValue && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ color: "#7A7A7A", marginBottom: "0.25rem", fontSize: "0.8125rem" }}>Vorher:</div>
                    <div style={{ color: "#EF4444", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {formatValue(log.oldValue)}
                    </div>
                  </div>
                )}
                {log.newValue && (
                  <div>
                    <div style={{ color: "#7A7A7A", marginBottom: "0.25rem", fontSize: "0.8125rem" }}>Nachher:</div>
                    <div style={{ color: "#10B981", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {formatValue(log.newValue)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Actor */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.75rem",
            }}>
              Ausführende Person
            </h3>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}>
              <div>
                <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Person:</strong>{" "}
                <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>
                  {log.actor?.name || log.actor?.email || log.actor?.id || "System"}
                </span>
              </div>
              {log.actorRole && (
                <div>
                  <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Rolle:</strong>{" "}
                  <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>{log.actorRole}</span>
                </div>
              )}
            </div>
          </section>

          {/* AI Context (only if AI-related) */}
          {log.source === "AI" && (
            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.75rem",
              }}>
                KI-Kontext
              </h3>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}>
                {log.aiModel && (
                  <div>
                    <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Modell:</strong>{" "}
                    <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>{log.aiModel}</span>
                    {log.aiModelVersion && (
                      <span style={{ color: "#7A7A7A", fontSize: "0.875rem" }}> ({log.aiModelVersion})</span>
                    )}
                  </div>
                )}
                {log.aiConfidenceScore !== null && (
                  <div>
                    <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Vertrauensbewertung:</strong>{" "}
                    <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>
                      {(log.aiConfidenceScore * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                <div>
                  <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Human-in-the-Loop:</strong>{" "}
                  <span style={{ color: "#0A0A0A", fontSize: "0.875rem" }}>
                    {log.humanInTheLoop ? "Ja" : "Nein"}
                  </span>
                </div>
                {log.regulatoryImpact && (
                  <div>
                    <strong style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>Regulatorische Auswirkung:</strong>{" "}
                    <span style={{
                      display: "inline-block",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.6875rem",
                      fontWeight: "600",
                      color: "#FFFFFF",
                      backgroundColor:
                        log.regulatoryImpact === "high" ? "#EF4444" :
                        log.regulatoryImpact === "medium" ? "#F59E0B" :
                        "#10B981",
                    }}>
                      {log.regulatoryImpact.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}


