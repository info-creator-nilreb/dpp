export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserOrganizations } from "@/lib/access"
import DashboardGrid from "@/components/DashboardGrid"
import DashboardCard from "@/components/DashboardCard"

export default async function DashboardPage() {
  try {
    const session = await auth()

    if (!session) {
      redirect("/login")
    }

    // Lade Organizations des Users
    let organizations
    try {
      organizations = await getUserOrganizations()
    } catch (error) {
      console.error("Error loading organizations:", error)
      organizations = []
    }

    return (
      <div>
        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Dashboard
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
          marginBottom: "2rem"
        }}>
          Willkommen zurück, {session.user?.name || session.user?.email}!
        </p>

        {/* Dashboard-Kacheln: 3 Spalten auf Desktop, 1 Spalte auf Mobile */}
        <DashboardGrid>
          {/* 1. Produktpass erstellen */}
          <DashboardCard
            href={organizations.length > 0 ? "/app/dpps/new" : "#"}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="#E20074"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
            title="Produktpass erstellen"
            description="Erstellen Sie einen neuen Digital Product Passport für Ihr Produkt."
          />

          {/* 2. Produktpässe verwalten */}
          <DashboardCard
            href="/app/dpps"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="#E20074"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            }
            title="Produktpässe verwalten"
            description="Verwalten Sie alle Ihre Digital Product Passports an einem Ort."
          />

          {/* 3. Meine Daten */}
          <DashboardCard
            href="/app/account"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="#E20074"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            title="Meine Daten"
            description="Verwalten Sie Ihre Kontoinformationen und Einstellungen."
          />
        </DashboardGrid>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    // Fallback: Zeige Fehlerseite
    return (
      <div>
        <h1>Fehler</h1>
        <p>Ein Fehler ist aufgetreten beim Laden des Dashboards.</p>
        <pre>{String(error)}</pre>
      </div>
    )
  }
}
