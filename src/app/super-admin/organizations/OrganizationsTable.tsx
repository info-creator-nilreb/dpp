"use client"

import { useState } from "react"
import Link from "next/link"

interface Organization {
  id: string
  name: string
  createdAt: Date
  _count: {
    memberships: number
    dpps: number
  }
}

interface OrganizationsTableProps {
  organizations: Organization[]
}

/**
 * Organizations Table Component
 * 
 * Shows organizations with actions (view, suspend, etc.)
 */
export default function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const [statusFilters, setStatusFilters] = useState<Record<string, string>>({})

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
        alignItems: "center"
      }}>
        <h2 style={{
          fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          margin: 0
        }}>
          Alle Organisationen ({organizations.length})
        </h2>
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
              Mitglieder
            </th>
            <th style={{
              padding: "clamp(0.75rem, 2vw, 1rem)",
              textAlign: "left",
              fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              whiteSpace: "nowrap"
            }}>
              DPPs
            </th>
            <th style={{
              padding: "clamp(0.75rem, 2vw, 1rem)",
              textAlign: "left",
              fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              whiteSpace: "nowrap"
            }}>
              Erstellt
            </th>
            <th style={{
              padding: "clamp(0.75rem, 2vw, 1rem)",
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
          {organizations.map((org) => (
            <tr
              key={org.id}
              style={{
                borderBottom: "1px solid #F5F5F5"
              }}
            >
              <td style={{ 
                padding: "clamp(0.75rem, 2vw, 1rem)",
                maxWidth: "300px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                <div style={{ fontWeight: "500", color: "#0A0A0A" }}>
                  {org.name}
                </div>
              </td>
              <td style={{ 
                padding: "clamp(0.75rem, 2vw, 1rem)", 
                color: "#7A7A7A",
                whiteSpace: "nowrap"
              }}>
                {org._count.memberships}
              </td>
              <td style={{ 
                padding: "clamp(0.75rem, 2vw, 1rem)", 
                color: "#7A7A7A",
                whiteSpace: "nowrap"
              }}>
                {org._count.dpps}
              </td>
              <td style={{ 
                padding: "clamp(0.75rem, 2vw, 1rem)", 
                color: "#7A7A7A",
                fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
                whiteSpace: "nowrap"
              }}>
                {new Date(org.createdAt).toLocaleDateString("de-DE")}
              </td>
              <td style={{ 
                padding: "clamp(0.75rem, 2vw, 1rem)", 
                textAlign: "right",
                whiteSpace: "nowrap"
              }}>
                <Link
                  href={`/super-admin/organizations/${org.id}`}
                  style={{
                    color: "#E20074",
                    textDecoration: "none",
                    fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
                    fontWeight: "500"
                  }}
                >
                  Details →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {organizations.length === 0 && (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          color: "#7A7A7A"
        }}>
          Keine Organisationen gefunden
        </div>
      )}
    </div>
  )
}

