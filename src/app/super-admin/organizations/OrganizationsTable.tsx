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
      overflow: "hidden"
    }}>
      <div style={{
        padding: "1rem",
        borderBottom: "1px solid #F5F5F5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h2 style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          color: "#0A0A0A"
        }}>
          Alle Organisationen ({organizations.length})
        </h2>
      </div>

      <table style={{
        width: "100%",
        borderCollapse: "collapse"
      }}>
        <thead>
          <tr style={{
            backgroundColor: "#F5F5F5",
            borderBottom: "1px solid #CDCDCD"
          }}>
            <th style={{
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              Name
            </th>
            <th style={{
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              Mitglieder
            </th>
            <th style={{
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              DPPs
            </th>
            <th style={{
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              Erstellt
            </th>
            <th style={{
              padding: "1rem",
              textAlign: "right",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
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
              <td style={{ padding: "1rem" }}>
                <div style={{ fontWeight: "500", color: "#0A0A0A" }}>
                  {org.name}
                </div>
              </td>
              <td style={{ padding: "1rem", color: "#7A7A7A" }}>
                {org._count.memberships}
              </td>
              <td style={{ padding: "1rem", color: "#7A7A7A" }}>
                {org._count.dpps}
              </td>
              <td style={{ padding: "1rem", color: "#7A7A7A" }}>
                {new Date(org.createdAt).toLocaleDateString("de-DE")}
              </td>
              <td style={{ padding: "1rem", textAlign: "right" }}>
                <Link
                  href={`/super-admin/organizations/${org.id}`}
                  style={{
                    color: "#E20074",
                    textDecoration: "none",
                    fontSize: "0.9rem",
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

