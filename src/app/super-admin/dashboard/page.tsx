/**
 * SUPER ADMIN DASHBOARD
 * 
 * Overview page for Super Admins
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import DashboardCard from "./DashboardCard"

export const dynamic = "force-dynamic"

export default async function SuperAdminDashboardPage() {
  // Check auth (middleware already protected route, but double-check for safety)
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }

  // Get statistics
  const [orgCount, userCount, dppCount] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.dpp.count()
  ])

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem"
      }}>
        <div>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Super Admin Dashboard
          </h1>
          <p style={{ color: "#7A7A7A" }}>
            Willkommen, {session.name || session.email}
          </p>
        </div>
        <form action="/api/super-admin/auth/logout" method="POST">
          <button
            type="submit"
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#7A7A7A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500"
            }}
          >
            Abmelden
          </button>
        </form>
      </div>

      {/* Navigation */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        <DashboardCard
          href="/super-admin/organizations"
          title="Organisationen"
          description={`${orgCount} Organisationen verwalten`}
        />
        <DashboardCard
          href="/super-admin/dpps"
          title="DPPs"
          description={`${dppCount} Produktpässe (Read-Only)`}
        />
        <DashboardCard
          href="/super-admin/templates"
          title="Templates"
          description="DPP-Templates verwalten"
        />
        <DashboardCard
          href="/super-admin/audit-logs"
          title="Audit Logs"
          description="Alle Admin-Aktionen einsehen"
        />

        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
            Benutzer
          </h2>
          <p style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>
            {userCount} Benutzer insgesamt
          </p>
        </div>

        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
            Produktpässe
          </h2>
          <p style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>
            {dppCount} DPPs insgesamt
          </p>
        </div>
      </div>

      {/* Role Info */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
          Ihre Rolle
        </h2>
        <p style={{ color: "#7A7A7A" }}>
          {session.role === "super_admin" && "Sie haben vollständigen Zugriff auf alle Funktionen."}
          {session.role === "support_admin" && "Sie haben Lese-/Schreibzugriff auf Organisationen und Benutzer."}
          {session.role === "read_only_admin" && "Sie haben nur Lesezugriff."}
        </p>
      </div>
    </div>
  )
}
