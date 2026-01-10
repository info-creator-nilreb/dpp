"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { getRoleLabel, PHASE1_ROLES, ROLE_LABELS } from "@/lib/phase1/roles"

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  role: string | null
  isCurrentUser?: boolean
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
}

interface JoinRequest {
  id: string
  userId: string
  user: {
    email: string
    firstName: string | null
    lastName: string | null
  }
  status: string
  message: string | null
  createdAt: string
}

export default function UsersClient() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"users" | "invitations" | "join-requests">("users")
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Invitation form
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("VIEWER")
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  // Initial load: Check if there are any join requests to determine if tab should be shown
  useEffect(() => {
    async function checkJoinRequests() {
      try {
        const response = await fetch("/api/app/organization/join-requests", {
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          const requests = data.joinRequests || []
          setJoinRequests(requests)
          
          // If active tab is join-requests but no requests exist, switch to users tab
          if (activeTab === "join-requests" && requests.filter((r: JoinRequest) => r.status === "pending").length === 0) {
            setActiveTab("users")
          }
        }
      } catch (err) {
        console.error("Error checking join requests:", err)
        // Fail silently - if we can't load join requests, tab won't be shown
        // Also switch away from join-requests tab if it's active
        if (activeTab === "join-requests") {
          setActiveTab("users")
        }
      }
    }
    checkJoinRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      if (activeTab === "users") {
        const response = await fetch("/api/app/organization/users", {
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          // Markiere aktuellen Benutzer, falls isCurrentUser nicht bereits gesetzt ist
          const usersWithCurrentUser = (data.users || []).map((user: User) => ({
            ...user,
            isCurrentUser: user.isCurrentUser ?? (session?.user?.id === user.id),
          }))
          setUsers(usersWithCurrentUser)
        }
      } else if (activeTab === "invitations") {
        const response = await fetch("/api/app/organization/invitations", {
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          setInvitations(data.invitations || [])
        }
      } else if (activeTab === "join-requests") {
        const response = await fetch("/api/app/organization/join-requests", {
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          setJoinRequests(data.joinRequests || [])
        }
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setError("E-Mail ist erforderlich")
      return
    }

    setInviting(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/app/organization/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Erstellen der Einladung")
      }

      setSuccess("Einladung erfolgreich erstellt und versendet")
      setInviteEmail("")
      setInviteRole("VIEWER")
      await loadData()
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Erstellen der Einladung")
    } finally {
      setInviting(false)
    }
  }

  async function handleDeleteInvitation(invitationId: string) {
    if (!confirm("Möchten Sie diese Einladung wirklich löschen?")) {
      return
    }

    try {
      const response = await fetch(`/api/app/organization/invitations/${invitationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen der Einladung")
      }

      setSuccess("Einladung gelöscht")
      await loadData()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Löschen der Einladung")
    }
  }

  async function handleJoinRequestAction(requestId: string, action: "approve" | "reject") {
    try {
      const response = await fetch(`/api/app/organization/join-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Fehler beim ${action === "approve" ? "Genehmigen" : "Ablehnen"} der Anfrage`)
      }

      setSuccess(`Anfrage erfolgreich ${action === "approve" ? "genehmigt" : "abgelehnt"}`)
      await loadData()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || `Fehler beim ${action === "approve" ? "Genehmigen" : "Ablehnen"} der Anfrage`)
    }
  }

  async function handleRemoveUser(userId: string) {
    if (!confirm("Möchten Sie diesen Benutzer wirklich aus der Organisation entfernen?")) {
      return
    }

    try {
      const response = await fetch(`/api/app/organization/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Entfernen des Benutzers")
      }

      setSuccess("Benutzer erfolgreich entfernt")
      await loadData()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Entfernen des Benutzers")
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/organization"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
          }}
        >
          ← Zur Organisation
        </Link>
      </div>

      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem",
      }}>
        Benutzer verwalten
      </h1>

      {error && (
        <div style={{
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#FEE",
          border: "1px solid #FCC",
          borderRadius: "6px",
          color: "#C33",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#E8F5E9",
          border: "1px solid #C8E6C9",
          borderRadius: "6px",
          color: "#2E7D32",
          fontSize: "0.9rem",
        }}>
          {success}
        </div>
      )}

      {/* Tabs - Mobile-optimiert mit horizontalem Scroll */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Hide scrollbar for Chrome, Safari and Opera */
          .users-tabs-scroll::-webkit-scrollbar {
            display: none;
          }
          /* Hide scrollbar for IE, Edge and Firefox */
          .users-tabs-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `
      }} />
      <div 
        className="users-tabs-scroll"
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "2rem",
          borderBottom: "1px solid #CDCDCD",
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: "2px",
        }}
      >
        <button
          onClick={() => setActiveTab("users")}
          style={{
            padding: "0.75rem clamp(0.75rem, 2vw, 1.5rem)",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "users" ? "2px solid #24c598" : "2px solid transparent",
            color: activeTab === "users" ? "#24c598" : "#7A7A7A",
            fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
            fontWeight: activeTab === "users" ? "600" : "400",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Benutzer ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          style={{
            padding: "0.75rem clamp(0.75rem, 2vw, 1.5rem)",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "invitations" ? "2px solid #24c598" : "2px solid transparent",
            color: activeTab === "invitations" ? "#24c598" : "#7A7A7A",
            fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
            fontWeight: activeTab === "invitations" ? "600" : "400",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Einladungen ({invitations.length})
        </button>
        {/* Tab "Beitrittsanfragen" nur anzeigen, wenn tatsächlich Requests vorhanden sind */}
        {joinRequests.filter(r => r.status === "pending").length > 0 && (
          <button
            onClick={() => setActiveTab("join-requests")}
            style={{
              padding: "0.75rem clamp(0.75rem, 2vw, 1.5rem)",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === "join-requests" ? "2px solid #24c598" : "2px solid transparent",
              color: activeTab === "join-requests" ? "#24c598" : "#7A7A7A",
              fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
              fontWeight: activeTab === "join-requests" ? "600" : "400",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Beitrittsanfragen ({joinRequests.filter(r => r.status === "pending").length})
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LoadingSpinner message="Daten werden geladen..." />
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === "users" && (
            <div style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #CDCDCD",
              borderRadius: "12px",
              padding: "2rem",
            }}>
              {users.length === 0 ? (
                <p style={{ color: "#7A7A7A", textAlign: "center" }}>Keine Benutzer gefunden</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {users.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        padding: "1rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <p style={{ margin: 0, fontWeight: "500", color: "#0A0A0A" }}>
                            {user.firstName} {user.lastName}
                          </p>
                          {user.isCurrentUser && (
                            <span style={{
                              padding: "0.125rem 0.5rem",
                              backgroundColor: "#24c598",
                              color: "#FFFFFF",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}>
                              Ich
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#7A7A7A" }}>
                          {user.email} • {getRoleLabel(user.role)}
                        </p>
                      </div>
                      {!user.isCurrentUser && (
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "transparent",
                            border: "1px solid #CDCDCD",
                            borderRadius: "6px",
                            color: "#C33",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                          }}
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === "invitations" && (
            <div>
              <div style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #CDCDCD",
                borderRadius: "12px",
                padding: "2rem",
                marginBottom: "2rem",
              }}>
                <h2 style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#0A0A0A",
                  marginBottom: "1.5rem",
                }}>
                  Neue Einladung
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "#0A0A0A",
                      fontWeight: "500",
                      fontSize: "0.9rem",
                    }}>
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "1rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "#0A0A0A",
                      fontWeight: "500",
                      fontSize: "0.9rem",
                    }}>
                      Rolle
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "1rem",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value={PHASE1_ROLES.VIEWER}>{ROLE_LABELS[PHASE1_ROLES.VIEWER]}</option>
                      <option value={PHASE1_ROLES.EDITOR}>{ROLE_LABELS[PHASE1_ROLES.EDITOR]}</option>
                      <option value={PHASE1_ROLES.ORG_ADMIN}>{ROLE_LABELS[PHASE1_ROLES.ORG_ADMIN]}</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: inviting ? "#CDCDCD" : "#24c598",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: inviting ? "not-allowed" : "pointer",
                  }}
                >
                  {inviting ? "Wird eingeladen..." : "Einladung senden"}
                </button>
              </div>

              <div style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #CDCDCD",
                borderRadius: "12px",
                padding: "2rem",
              }}>
                <h2 style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#0A0A0A",
                  marginBottom: "1.5rem",
                }}>
                  Ausstehende Einladungen
                </h2>
                {invitations.length === 0 ? (
                  <p style={{ color: "#7A7A7A", textAlign: "center" }}>Keine Einladungen</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        style={{
                          padding: "1rem",
                          border: "1px solid #CDCDCD",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: "500", color: "#0A0A0A" }}>
                            {invitation.email}
                          </p>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#7A7A7A" }}>
                            {invitation.role} • {invitation.status} • Läuft ab: {new Date(invitation.expiresAt).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                        {invitation.status === "pending" && (
                          <button
                            onClick={() => handleDeleteInvitation(invitation.id)}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "transparent",
                              border: "1px solid #CDCDCD",
                              borderRadius: "6px",
                              color: "#C33",
                              fontSize: "0.9rem",
                              cursor: "pointer",
                            }}
                          >
                            Löschen
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Join Requests Tab */}
          {activeTab === "join-requests" && (
            <div style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #CDCDCD",
              borderRadius: "12px",
              padding: "2rem",
            }}>
              {joinRequests.length === 0 ? (
                <p style={{ color: "#7A7A7A", textAlign: "center" }}>Keine Beitrittsanfragen</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {joinRequests.map((request) => (
                    <div
                      key={request.id}
                      style={{
                        padding: "1rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: "500", color: "#0A0A0A" }}>
                            {request.user.firstName} {request.user.lastName}
                          </p>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#7A7A7A" }}>
                            {request.user.email} • {request.status}
                          </p>
                          {request.message && (
                            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "#0A0A0A" }}>
                              {request.message}
                            </p>
                          )}
                        </div>
                        {request.status === "pending" && (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => handleJoinRequestAction(request.id, "approve")}
                              style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#00A651",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                              }}
                            >
                              Genehmigen
                            </button>
                            <button
                              onClick={() => handleJoinRequestAction(request.id, "reject")}
                              style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "transparent",
                                border: "1px solid #CDCDCD",
                                borderRadius: "6px",
                                color: "#C33",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                              }}
                            >
                              Ablehnen
                            </button>
                          </div>
                        )}
                      </div>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#7A7A7A" }}>
                        Erstellt: {new Date(request.createdAt).toLocaleString("de-DE")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

