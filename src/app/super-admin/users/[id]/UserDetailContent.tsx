"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import ConfirmationModal from "@/components/super-admin/ConfirmationModal"

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name: string | null
  status: string
  lastLoginAt: Date | null
  createdAt: Date
  role: string | null
  organizationName: string | null
  organizationId: string | null
}

interface UserDetailContentProps {
  user: User
  canUpdate: boolean
}

export default function UserDetailContent({ user: initialUser, canUpdate }: UserDetailContentProps) {
  const [user, setUser] = useState(initialUser)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details")
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    firstName: initialUser.firstName || "",
    lastName: initialUser.lastName || "",
    role: initialUser.role || ""
  })
  const [saving, setSaving] = useState(false)
  
  // Confirmation modals
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (activeTab === "activity") {
      loadAuditLogs()
    }
  }, [activeTab, user.id])

  async function loadAuditLogs() {
    setLoadingLogs(true)
    try {
      const response = await fetch(`/api/super-admin/users/${user.id}/audit-logs`)
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.logs || [])
      }
    } catch (err) {
      console.error("Error loading audit logs:", err)
    } finally {
      setLoadingLogs(false)
    }
  }

  async function handlePasswordReset() {
    setActionLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/super-admin/users/${user.id}/password-reset`, {
        method: "POST"
      })
      if (response.ok) {
        setSuccess("Passwort-Reset-E-Mail wurde gesendet")
        setShowPasswordResetModal(false)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Fehler beim Senden der Passwort-Reset-E-Mail")
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSuspend() {
    setActionLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/super-admin/users/${user.id}/suspend`, {
        method: "POST"
      })
      if (response.ok) {
        const data = await response.json()
        setUser({ ...user, status: "suspended" })
        setSuccess("Benutzer wurde gesperrt")
        setShowSuspendModal(false)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Fehler beim Sperren des Benutzers")
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReactivate() {
    setActionLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/super-admin/users/${user.id}/reactivate`, {
        method: "POST"
      })
      if (response.ok) {
        const data = await response.json()
        setUser({ ...user, status: "active" })
        setSuccess("Benutzer wurde reaktiviert")
        setShowReactivateModal(false)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Fehler beim Reaktivieren des Benutzers")
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        const data = await response.json()
        setUser({ ...user, ...data.user })
        setIsEditing(false)
        setSuccess("Benutzer wurde erfolgreich aktualisiert")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Fehler beim Speichern")
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEditData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role || ""
    })
    setIsEditing(false)
    setError("")
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Nie"
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getRoleLabel = (role: string | null) => {
    if (!role) return "—"
    switch (role) {
      case "ORG_ADMIN": return "Organisations-Administrator"
      case "EDITOR": return "Editor"
      case "VIEWER": return "Betrachter"
      default: return role
    }
  }

  return (
    <div style={{ 
      maxWidth: "100%", 
      margin: "0 auto", 
      padding: "clamp(1rem, 2vw, 2rem)",
      boxSizing: "border-box",
      width: "100%",
      overflowX: "hidden"
    }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/super-admin/users"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
            marginBottom: "0.5rem",
            display: "block"
          }}
        >
          ← Zurück zu Benutzer
        </Link>
        <h1 style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          margin: 0,
          wordBreak: "break-word"
        }}>
          {user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.name || user.email}
        </h1>
      </div>

      {error && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEE2E2",
          border: "1px solid #FCA5A5",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#991B1B"
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#D1FAE5",
          border: "1px solid #86EFAC",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#065F46"
        }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        borderBottom: "1px solid #CDCDCD",
        marginBottom: "2rem",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        width: "100%"
      }}>
        <button
          onClick={() => setActiveTab("details")}
          style={{
            padding: "clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)",
            border: "none",
            backgroundColor: "transparent",
            color: activeTab === "details" ? "#E20074" : "#7A7A7A",
            fontWeight: activeTab === "details" ? "600" : "400",
            borderBottom: activeTab === "details" ? "2px solid #E20074" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          style={{
            padding: "clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)",
            border: "none",
            backgroundColor: "transparent",
            color: activeTab === "activity" ? "#E20074" : "#7A7A7A",
            fontWeight: activeTab === "activity" ? "600" : "400",
            borderBottom: activeTab === "activity" ? "2px solid #E20074" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Benutzeraktivität
        </button>
      </div>

      {activeTab === "details" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "clamp(1rem, 3vw, 2rem)"
        }}
        className="user-detail-grid"
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              @media (min-width: 768px) {
                .user-detail-grid {
                  grid-template-columns: 1fr 1fr !important;
                }
              }
            `
          }} />
          {/* Personal Information */}
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            padding: "1.5rem"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <h2 style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#0A0A0A",
                margin: 0
              }}>
                Persönliche Informationen
              </h2>
              {canUpdate && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#E20074",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Bearbeiten
                </button>
              )}
            </div>
            <div style={{ display: "grid", gap: "1rem" }}>
              {isEditing ? (
                <>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#7A7A7A",
                      marginBottom: "0.5rem"
                    }}>
                      Vorname *
                    </label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#7A7A7A",
                      marginBottom: "0.5rem"
                    }}>
                      Nachname *
                    </label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.5rem"
                  }}>
                    <button
                      onClick={handleSave}
                      disabled={saving || !editData.firstName || !editData.lastName}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#E20074",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        cursor: (saving || !editData.firstName || !editData.lastName) ? "not-allowed" : "pointer",
                        opacity: (saving || !editData.firstName || !editData.lastName) ? 0.6 : 1
                      }}
                    >
                      {saving ? "Speichern..." : "Speichern"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#FFFFFF",
                        color: "#0A0A0A",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        cursor: saving ? "not-allowed" : "pointer"
                      }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#7A7A7A",
                    marginBottom: "0.5rem"
                  }}>
                    Name
                  </label>
                  <p style={{
                    fontSize: "1rem",
                    color: "#0A0A0A",
                    margin: 0
                  }}>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.name || "—"}
                  </p>
                </div>
              )}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#7A7A7A",
                  marginBottom: "0.5rem"
                }}>
                  E-Mail
                </label>
                <p style={{
                  fontSize: "1rem",
                  color: "#0A0A0A",
                  margin: 0
                }}>
                  {user.email}
                </p>
              </div>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#7A7A7A",
                  marginBottom: "0.5rem"
                }}>
                  Status
                </label>
                <span style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  backgroundColor: user.status === "active" 
                    ? "#D1FAE5" 
                    : user.status === "suspended"
                    ? "#FEE2E2"
                    : "#FEF3C7",
                  color: user.status === "active"
                    ? "#065F46"
                    : user.status === "suspended"
                    ? "#991B1B"
                    : "#92400E"
                }}>
                  {user.status === "active" ? "Aktiv" : user.status === "suspended" ? "Gesperrt" : "Eingeladen"}
                </span>
              </div>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#7A7A7A",
                  marginBottom: "0.5rem"
                }}>
                  Erstellt am
                </label>
                <p style={{
                  fontSize: "1rem",
                  color: "#0A0A0A",
                  margin: 0
                }}>
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#7A7A7A",
                  marginBottom: "0.5rem"
                }}>
                  Letzter Login
                </label>
                <p style={{
                  fontSize: "1rem",
                  color: "#0A0A0A",
                  margin: 0
                }}>
                  {formatDate(user.lastLoginAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Organization Context */}
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            padding: "1.5rem"
          }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1.5rem"
            }}>
              Organisationskontext
            </h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#7A7A7A",
                  marginBottom: "0.5rem"
                }}>
                  Organisation
                </label>
                {user.organizationName ? (
                  <Link
                    href={`/super-admin/organizations/${user.organizationId}`}
                    style={{
                      fontSize: "1rem",
                      color: "#E20074",
                      textDecoration: "none",
                      fontWeight: "500"
                    }}
                  >
                    {user.organizationName}
                  </Link>
                ) : (
                  <p style={{
                    fontSize: "1rem",
                    color: "#7A7A7A",
                    margin: 0
                  }}>
                    Keine Organisation
                  </p>
                )}
              </div>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#7A7A7A",
                  marginBottom: "0.5rem"
                }}>
                  Rolle
                </label>
                {isEditing ? (
                  <select
                    value={editData.role}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      boxSizing: "border-box",
                      backgroundColor: "#FFFFFF"
                    }}
                  >
                    <option value="">—</option>
                    <option value="ORG_ADMIN">Organisations-Administrator</option>
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Betrachter</option>
                  </select>
                ) : (
                  <p style={{
                    fontSize: "1rem",
                    color: "#0A0A0A",
                    margin: 0
                  }}>
                    {getRoleLabel(user.role)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {canUpdate && (
            <div style={{
              padding: "clamp(1rem, 2vw, 1.5rem)",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              width: "100%",
              boxSizing: "border-box"
            }}>
              <h2 style={{
                fontSize: "clamp(1.1rem, 2.5vw, 1.25rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "1rem"
              }}>
                Aktionen
              </h2>
              <div style={{ 
                display: "flex", 
                gap: "clamp(0.5rem, 2vw, 1rem)", 
                flexWrap: "wrap" 
              }}>
                <button
                  onClick={() => setShowPasswordResetModal(true)}
                  disabled={actionLoading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#E20074",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  Passwort zurücksetzen
                </button>
                {user.status === "active" ? (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    disabled={actionLoading}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      opacity: actionLoading ? 0.6 : 1
                    }}
                  >
                    Benutzer sperren
                  </button>
                ) : (
                  <button
                    onClick={() => setShowReactivateModal(true)}
                    disabled={actionLoading}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#059669",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      opacity: actionLoading ? 0.6 : 1
                    }}
                  >
                    Benutzer reaktivieren
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "1.5rem"
          }}>
            Benutzeraktivität
          </h2>
          {loadingLogs ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <LoadingSpinner message="Lade Aktivitätsprotokoll..." />
            </div>
          ) : auditLogs.length === 0 ? (
            <p style={{ color: "#7A7A7A", textAlign: "center", padding: "2rem" }}>
              Keine Aktivitäten gefunden
            </p>
          ) : (
            <div style={{ 
              overflowX: "auto",
              width: "100%",
              WebkitOverflowScrolling: "touch"
            }}>
              <table style={{ 
                width: "100%", 
                minWidth: "600px",
                borderCollapse: "collapse" 
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#F5F5F5", borderBottom: "1px solid #CDCDCD" }}>
                    <th style={{ 
                      padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                      textAlign: "left", 
                      fontSize: "clamp(0.8rem, 2vw, 0.85rem)", 
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}>
                      Zeitpunkt
                    </th>
                    <th style={{ 
                      padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                      textAlign: "left", 
                      fontSize: "clamp(0.8rem, 2vw, 0.85rem)", 
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}>
                      Aktion
                    </th>
                    <th style={{ 
                      padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                      textAlign: "left", 
                      fontSize: "clamp(0.8rem, 2vw, 0.85rem)", 
                      fontWeight: "600"
                    }}>
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                      <td style={{ 
                        padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                        fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)", 
                        color: "#7A7A7A",
                        whiteSpace: "nowrap"
                      }}>
                        {new Date(log.timestamp || log.createdAt).toLocaleString("de-DE")}
                      </td>
                      <td style={{ 
                        padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                        fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)", 
                        color: "#0A0A0A",
                        wordBreak: "break-word"
                      }}>
                        {log.actionType}
                      </td>
                      <td style={{ 
                        padding: "clamp(0.5rem, 1.5vw, 0.75rem)", 
                        fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)", 
                        color: "#0A0A0A",
                        wordBreak: "break-word",
                        maxWidth: "300px"
                      }}>
                        {log.metadata ? JSON.stringify(log.metadata) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
        onConfirm={handlePasswordReset}
        title="Passwort zurücksetzen"
        message={`Möchten Sie wirklich eine Passwort-Reset-E-Mail an ${user.email} senden?`}
        confirmText="E-Mail senden"
        loading={actionLoading}
      />

      <ConfirmationModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspend}
        title="Benutzer sperren"
        message={`Möchten Sie wirklich den Benutzer ${user.email} sperren? Der Benutzer kann sich danach nicht mehr anmelden.`}
        confirmText="Sperren"
        loading={actionLoading}
      />

      <ConfirmationModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onConfirm={handleReactivate}
        title="Benutzer reaktivieren"
        message={`Möchten Sie wirklich den Benutzer ${user.email} reaktivieren?`}
        confirmText="Reaktivieren"
        loading={actionLoading}
      />
    </div>
  )
}

