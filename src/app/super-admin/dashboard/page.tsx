/**
 * SUPER ADMIN DASHBOARD
 * 
 * Modern B2B SaaS Dashboard with 3 clear sections:
 * 1. Arbeitsbereiche - Work areas (large, clickable cards)
 * 2. Systemüberblick - System overview (KPI stats)
 * 3. Ihre Rolle & Zugriff - Role & permissions info
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { redirect } from "next/navigation"
import WorkAreaCard from "./components/WorkAreaCard"
import SystemOverview from "./components/SystemOverview"
import { 
  OrganizationsIconLarge, 
  DppsIconLarge, 
  TemplatesIconLarge, 
  UsersIconLarge, 
  AuditLogsIconLarge,
  FeatureRegistryIconLarge
} from "../components/Icons"

export const dynamic = "force-dynamic"

export default async function SuperAdminDashboardPage() {
  // Check auth (middleware already protected route, but double-check for safety)
  let session
  try {
    session = await getSuperAdminSession()
  } catch (error) {
    console.error("Error getting super admin session:", error)
    redirect("/super-admin/login")
  }
  
  if (!session) {
    redirect("/super-admin/login")
  }

  // Role descriptions
  const roleDescriptions: Record<string, string> = {
    super_admin: "Vollständiger Zugriff auf alle Funktionen",
    support_admin: "Lese-/Schreibzugriff auf Organisationen und Benutzer",
    read_only_admin: "Nur Lesezugriff",
  }

  const permissionLevels: Record<string, string> = {
    super_admin: "Vollzugriff",
    support_admin: "Eingeschränkt",
    read_only_admin: "Nur-Lesen",
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Dashboard
        </h1>
        <p style={{ color: "#7A7A7A", fontSize: "1rem" }}>
          Willkommen, {session.name || session.email}
        </p>
      </div>

      {/* SECTION 1: Systemüberblick (PRIMARY ENTRY POINT) */}
      <SystemOverview />

      {/* Visual Separator */}
      <div style={{
        height: "1px",
        backgroundColor: "#E5E5E5",
        marginBottom: "4rem"
      }} />

      {/* SECTION 2: Arbeitsbereiche */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1.5rem"
        }}>
          Arbeitsbereiche
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}>
          <WorkAreaCard
            href="/super-admin/organizations"
            icon={<OrganizationsIconLarge />}
            title="Organisationen"
            description="Organisationen verwalten, Mitglieder zuweisen und Status ändern"
          />
          <WorkAreaCard
            href="/super-admin/dpps"
            icon={<DppsIconLarge />}
            title="DPPs"
            description="Alle Digitalen Produktpässe durchsuchen und einsehen (Read-Only)"
          />
          <WorkAreaCard
            href="/super-admin/templates"
            icon={<TemplatesIconLarge />}
            title="Templates"
            description="DPP-Templates erstellen, bearbeiten und verwalten"
          />
          <WorkAreaCard
            href="/super-admin/users"
            icon={<UsersIconLarge />}
            title="Benutzer"
            description="Benutzer verwalten und Zugriffe konfigurieren"
          />
          <WorkAreaCard
            href="/super-admin/audit-logs"
            icon={<AuditLogsIconLarge />}
            title="Audit Logs"
            description="Alle Admin-Aktionen und Änderungen einsehen"
          />
          <WorkAreaCard
            href="/super-admin/feature-registry"
            icon={<FeatureRegistryIconLarge />}
            title="Funktionen"
            description="Systemweite Funktionen und Tarifzuordnung"
          />
        </div>
      </section>

      {/* SECTION 3: Ihre Rolle & Zugriff */}
      <section>
        <div style={{
          paddingTop: "2rem",
          borderTop: "1px solid #E5E5E5",
        }}>
          <h2 style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            color: "#7A7A7A",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Ihre Rolle & Zugriff
          </h2>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{
                fontSize: "0.875rem",
                color: "#7A7A7A",
                fontWeight: "500",
                minWidth: "120px",
              }}>
                Rolle:
              </span>
              <span style={{
                fontSize: "0.875rem",
                color: "#0A0A0A",
                fontWeight: "600",
                textTransform: "capitalize",
              }}>
                {session.role?.replace("_", " ") || "Unbekannt"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{
                fontSize: "0.875rem",
                color: "#7A7A7A",
                fontWeight: "500",
                minWidth: "120px",
              }}>
                Zugriff:
              </span>
              <span style={{
                fontSize: "0.875rem",
                color: "#7A7A7A",
              }}>
                {permissionLevels[session.role || ""] || "Unbekannt"}
              </span>
            </div>
            <div style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "#9A9A9A",
              fontStyle: "italic",
            }}>
              {roleDescriptions[session.role || ""] || "Rolle nicht gefunden"}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
