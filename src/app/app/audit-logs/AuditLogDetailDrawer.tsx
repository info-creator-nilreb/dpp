"use client"

/**
 * Audit Log Detail Drawer Component
 * 
 * Shows full details of a single audit log entry
 */

import { AuditLog } from "./AuditLogsClient"
import { getActionLabel, getEntityLabel, getSourceLabel } from "@/lib/audit/audit-labels"

interface AuditLogDetailDrawerProps {
  log: AuditLog
  onClose: () => void
}

export default function AuditLogDetailDrawer({
  log,
  onClose,
}: AuditLogDetailDrawerProps) {
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

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(600px, 90vw)",
          backgroundColor: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.15)",
          zIndex: 1001,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid #E5E5E5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#0A0A0A",
            margin: 0,
          }}>
            Audit Log Details
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

        {/* Content */}
        <div style={{ padding: "1.5rem", flex: 1 }}>
          {/* Summary */}
          <section style={{ marginBottom: "2rem" }}>
            <h3 style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1rem",
            }}>
              Zusammenfassung
            </h3>
            <div style={{
              display: "grid",
              gap: "0.75rem",
            }}>
              <div>
                <strong style={{ color: "#7A7A7A" }}>Zeit:</strong>{" "}
                <span style={{ color: "#0A0A0A" }}>{formatTimestamp(log.timestamp)}</span>
              </div>
              <div>
                <strong style={{ color: "#7A7A7A" }}>Aktion:</strong>{" "}
                <span style={{ color: "#0A0A0A" }}>{getActionLabel(log.actionType)}</span>
              </div>
              <div>
                <strong style={{ color: "#7A7A7A" }}>Objekt:</strong>{" "}
                <span style={{ color: "#0A0A0A" }}>{getEntityLabel(log.entityType)} {log.entityId || ""}</span>
              </div>
              <div>
                <strong style={{ color: "#7A7A7A" }}>Quelle:</strong>{" "}
                <span style={{ color: "#0A0A0A" }}>{getSourceLabel(log.source)}</span>
              </div>
              {log.complianceRelevant && (
                <div>
                  <span style={{
                    display: "inline-block",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    backgroundColor: "#EF4444",
                  }}>
                    Compliance-relevant
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Before / After Diff */}
          {(log.fieldName || log.oldValue || log.newValue) && (
            <section style={{ marginBottom: "2rem" }}>
              <h3 style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "1rem",
              }}>
                Änderungen
              </h3>
              {log.fieldName && (
                <div style={{ marginBottom: "1rem" }}>
                  <strong style={{ color: "#7A7A7A" }}>Feld:</strong>{" "}
                  <span style={{ color: "#0A0A0A" }}>{log.fieldName}</span>
                </div>
              )}
              <div style={{
                backgroundColor: "#F9F9F9",
                padding: "1rem",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}>
                {log.oldValue && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ color: "#7A7A7A", marginBottom: "0.5rem" }}>Vorher:</div>
                    <div style={{ color: "#EF4444", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(log.oldValue, null, 2)}
                    </div>
                  </div>
                )}
                {log.newValue && (
                  <div>
                    <div style={{ color: "#7A7A7A", marginBottom: "0.5rem" }}>Nachher:</div>
                    <div style={{ color: "#10B981", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(log.newValue, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Actor & Organization */}
          <section style={{ marginBottom: "2rem" }}>
            <h3 style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1rem",
            }}>
              Actor & Organisation
            </h3>
            <div style={{
              display: "grid",
              gap: "0.75rem",
            }}>
              <div>
                <strong style={{ color: "#7A7A7A" }}>Ausführende Person:</strong>{" "}
                <span style={{ color: "#0A0A0A" }}>
                  {log.actor?.name || log.actor?.email || log.actor?.id || "System"}
                </span>
              </div>
              {log.actorRole && (
                <div>
                  <strong style={{ color: "#7A7A7A" }}>Rolle:</strong>{" "}
                  <span style={{ color: "#0A0A0A" }}>{log.actorRole}</span>
                </div>
              )}
              {log.organization && (
                <div>
                  <strong style={{ color: "#7A7A7A" }}>Organisation:</strong>{" "}
                  <span style={{ color: "#0A0A0A" }}>{log.organization.name}</span>
                </div>
              )}
              {log.ipAddress && (
                <div>
                  <strong style={{ color: "#7A7A7A" }}>IP-Adresse:</strong>{" "}
                  <span style={{ color: "#0A0A0A" }}>{log.ipAddress}</span>
                </div>
              )}
            </div>
          </section>

          {/* AI Context (only if AI-related) */}
          {log.source === "AI" && (
            <section style={{ marginBottom: "2rem" }}>
              <h3 style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "1rem",
              }}>
                KI-Kontext
              </h3>
              <div style={{
                display: "grid",
                gap: "0.75rem",
              }}>
                {log.aiModel && (
                  <div>
                    <strong style={{ color: "#7A7A7A" }}>Modell:</strong>{" "}
                    <span style={{ color: "#0A0A0A" }}>{log.aiModel}</span>
                    {log.aiModelVersion && (
                      <span style={{ color: "#7A7A7A" }}> ({log.aiModelVersion})</span>
                    )}
                  </div>
                )}
                {log.aiPromptId && (
                  <div>
                    <strong style={{ color: "#7A7A7A" }}>Prompt ID:</strong>{" "}
                    <span style={{ color: "#0A0A0A", fontFamily: "monospace" }}>{log.aiPromptId}</span>
                  </div>
                )}
                {log.aiInputSources && log.aiInputSources.length > 0 && (
                  <div>
                    <strong style={{ color: "#7A7A7A" }}>Input-Quellen:</strong>{" "}
                    <span style={{ color: "#0A0A0A" }}>{log.aiInputSources.join(", ")}</span>
                  </div>
                )}
                {log.aiConfidenceScore !== null && (
                  <div>
                    <strong style={{ color: "#7A7A7A" }}>Confidence Score:</strong>{" "}
                    <span style={{ color: "#0A0A0A" }}>{(log.aiConfidenceScore * 100).toFixed(1)}%</span>
                  </div>
                )}
                {log.aiExplainabilityNote && (
                  <div>
                    <strong style={{ color: "#7A7A7A" }}>Erklärbarkeit:</strong>{" "}
                    <span style={{ color: "#0A0A0A" }}>{log.aiExplainabilityNote}</span>
                  </div>
                )}
                <div>
                  <strong style={{ color: "#7A7A7A" }}>Human-in-the-Loop:</strong>{" "}
                  <span style={{ color: "#0A0A0A" }}>
                    {log.humanInTheLoop ? "Ja" : "Nein"}
                  </span>
                </div>
                {log.finalDecisionBy && (
                  <div>
                    <strong style={{ color: "#7A7A7A" }}>Finale Entscheidung durch:</strong>{" "}
                    <span style={{ color: "#0A0A0A" }}>{log.finalDecisionBy}</span>
                  </div>
                )}
                {log.regulatoryImpact && (
                  <div>
                    <strong style={{ color: "#7A7A7A" }}>Regulatorische Auswirkung:</strong>{" "}
                    <span style={{
                      display: "inline-block",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
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

          {/* Related DPP / Version */}
          {log.versionId && (
            <section style={{ marginBottom: "2rem" }}>
              <h3 style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "1rem",
              }}>
                Verwandte Version
              </h3>
              <div>
                <strong style={{ color: "#7A7A7A" }}>Version ID:</strong>{" "}
                <span style={{ color: "#0A0A0A", fontFamily: "monospace" }}>{log.versionId}</span>
              </div>
            </section>
          )}

          {/* Raw JSON */}
          <section>
            <h3 style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1rem",
            }}>
              Raw JSON (Read-only)
            </h3>
            <pre style={{
              backgroundColor: "#F9F9F9",
              padding: "1rem",
              borderRadius: "8px",
              overflow: "auto",
              fontSize: "0.75rem",
              fontFamily: "monospace",
              maxHeight: "300px",
            }}>
              {JSON.stringify(log, null, 2)}
            </pre>
          </section>
        </div>
      </div>
    </>
  )
}

