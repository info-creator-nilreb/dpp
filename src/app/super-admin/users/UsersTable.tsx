"use client"

import { useState } from "react"
import Link from "next/link"

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

interface UsersTableProps {
  users: User[]
  canCreate: boolean
}

/**
 * Users Table Component
 * 
 * Shows all users with organization and role information
 */
export default function UsersTable({ users, canCreate }: UsersTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredUsers = statusFilter === "all" 
    ? users 
    : users.filter(user => user.status === statusFilter)

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Aktiv"
      case "invited": return "Eingeladen"
      case "suspended": return "Gesperrt"
      default: return status
    }
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
      backgroundColor: "#FFFFFF",
      border: "1px solid #CDCDCD",
      borderRadius: "8px",
      overflow: "hidden",
      width: "100%",
      boxSizing: "border-box"
    }}>
      <div style={{
        padding: "clamp(0.75rem, 2vw, 1rem)",
        borderBottom: "1px solid #F5F5F5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <h2 style={{
          fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          margin: 0
        }}>
          Alle Benutzer ({filteredUsers.length})
        </h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid #CDCDCD",
            borderRadius: "6px",
            fontSize: "0.9rem",
            backgroundColor: "#FFFFFF",
            minWidth: "150px"
          }}
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="invited">Eingeladen</option>
          <option value="suspended">Gesperrt</option>
        </select>
      </div>

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
            <tr style={{
              backgroundColor: "#F5F5F5",
              borderBottom: "1px solid #CDCDCD"
            }}>
              <th style={{
                padding: "clamp(0.75rem, 2vw, 1rem)",
                paddingLeft: "clamp(1rem, 3vw, 1.5rem)",
                textAlign: "left",
                fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                whiteSpace: "nowrap"
              }}>
                Name
              </th>
              <th style={{
                padding: "clamp(0.75rem, 2vw, 1rem)",
                textAlign: "left",
                fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                whiteSpace: "nowrap"
              }}>
                Organisation
              </th>
              <th style={{
                padding: "clamp(0.75rem, 2vw, 1rem)",
                textAlign: "left",
                fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                whiteSpace: "nowrap"
              }}>
                Rolle
              </th>
              <th style={{
                padding: "clamp(0.75rem, 2vw, 1rem)",
                textAlign: "left",
                fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                whiteSpace: "nowrap"
              }}>
                Status
              </th>
              <th style={{
                padding: "clamp(0.75rem, 2vw, 1rem)",
                paddingRight: "clamp(1rem, 3vw, 1.5rem)",
                textAlign: "right",
                fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                whiteSpace: "nowrap"
              }}>
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#7A7A7A"
                }}>
                  Keine Benutzer gefunden
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: "1px solid #F5F5F5",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#FAFAFA"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  <td style={{ 
                    padding: "clamp(0.75rem, 2vw, 1rem)",
                    paddingLeft: "clamp(1rem, 3vw, 1.5rem)",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    <Link
                      href={`/super-admin/users/${user.id}`}
                      style={{
                        color: "#E20074",
                        textDecoration: "none",
                        fontWeight: "500"
                      }}
                    >
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.name || user.email}
                    </Link>
                  </td>
                  <td style={{ 
                    padding: "clamp(0.75rem, 2vw, 1rem)",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {user.organizationName ? (
                      <Link
                        href={`/super-admin/organizations/${user.organizationId}`}
                        style={{
                          color: "#E20074",
                          textDecoration: "none"
                        }}
                      >
                        {user.organizationName}
                      </Link>
                    ) : (
                      <span style={{ color: "#7A7A7A" }}>—</span>
                    )}
                  </td>
                  <td style={{ 
                    padding: "clamp(0.75rem, 2vw, 1rem)", 
                    color: "#0A0A0A",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {getRoleLabel(user.role)}
                  </td>
                  <td style={{ padding: "clamp(0.75rem, 2vw, 1rem)", whiteSpace: "nowrap" }}>
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "clamp(0.75rem, 1.5vw, 0.85rem)",
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
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td style={{ 
                    padding: "clamp(0.75rem, 2vw, 1rem)",
                    paddingRight: "clamp(1rem, 3vw, 1.5rem)",
                    textAlign: "right",
                    whiteSpace: "nowrap"
                  }}>
                    <Link
                      href={`/super-admin/users/${user.id}`}
                      style={{
                        padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
                        backgroundColor: "#E20074",
                        color: "#FFFFFF",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "clamp(0.75rem, 1.5vw, 0.85rem)",
                        fontWeight: "500",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

