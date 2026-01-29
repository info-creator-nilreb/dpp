"use client"

import Link from "next/link"
import FilterBar from "./FilterBar"

interface Dpp {
  id: string
  name: string
  category: string | null
  status: string
  updatedAt: Date
  organization: {
    id: string
    name: string
  }
  _count: {
    versions: number
  }
}

interface Organization {
  id: string
  name: string
}

interface DppsTableProps {
  dpps: Dpp[]
  organizations: Organization[]
  availableCategories: string[]
  availableStatuses: string[]
  currentFilters: {
    q: string
    organizationId: string
    category: string
    status: string
  }
}

/**
 * DPPs Table Component
 * 
 * Shows DPPs with organization info (read-only)
 */
export default function DppsTable({
  dpps,
  organizations,
  availableCategories,
  availableStatuses,
  currentFilters
}: DppsTableProps) {
  return (
    <div>
      <FilterBar
        organizations={organizations}
        availableCategories={availableCategories}
        availableStatuses={availableStatuses}
        currentFilters={currentFilters}
      />

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
          Alle DPPs ({dpps.length})
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
              Organisation
            </th>
            <th style={{
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              Kategorie
            </th>
            <th style={{
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              Status
            </th>
            <th style={{
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              Versionen
            </th>
            <th style={{
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              Aktualisiert
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
          {dpps.map((dpp) => (
            <tr
              key={dpp.id}
              style={{
                borderBottom: "1px solid #F5F5F5"
              }}
            >
              <td style={{ padding: "1rem" }}>
                <div style={{ fontWeight: "500", color: "#0A0A0A" }}>
                  {dpp.name}
                </div>
              </td>
              <td style={{ padding: "1rem", color: "#7A7A7A" }}>
                {dpp.organization.name}
              </td>
              <td style={{ padding: "1rem", color: "#7A7A7A" }}>
                {dpp.category || "-"}
              </td>
              <td style={{ padding: "1rem" }}>
                <span style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  backgroundColor: dpp.status === "PUBLISHED" ? "#F0FDF4" : "#FEF3C7",
                  color: dpp.status === "PUBLISHED" ? "#16A34A" : "#D97706"
                }}>
                  {dpp.status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"}
                </span>
              </td>
              <td style={{ padding: "1rem", color: "#7A7A7A" }}>
                {dpp._count.versions}
              </td>
              <td style={{ padding: "1rem", color: "#7A7A7A" }}>
                {new Date(dpp.updatedAt).toLocaleDateString("de-DE")}
              </td>
              <td style={{ padding: "1rem", textAlign: "right" }}>
                <Link
                  href={`/super-admin/dpps/${dpp.id}`}
                  style={{
                    color: "#24c598",
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

      {dpps.length === 0 && (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          color: "#7A7A7A"
        }}>
          Keine DPPs gefunden
        </div>
      )}
    </div>
    </div>
  )
}
