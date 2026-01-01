"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAppData } from "@/contexts/AppDataContext"
import DashboardGrid from "@/components/DashboardGrid"
import DashboardCard from "@/components/DashboardCard"
import SubscriptionUsageCard, { type SubscriptionStatus, type UsageData } from "@/components/SubscriptionUsageCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface SubscriptionContext {
  state: "loading" | "none" | "trial" | "active"
  canAccessApp: boolean
  canPublish: boolean
  trialEndsAt: string | null
}

export default function DashboardClient() {
  const router = useRouter()
  const { data: session } = useSession()
  const { availableFeatures } = useAppData()
  const [context, setContext] = useState<SubscriptionContext | null>(null)
  
  // User role from Session (synchronously available)
  const userRole = session?.user?.role ?? null
  const [statusData, setStatusData] = useState<SubscriptionStatus | null>(null)
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadContext() {
      try {
        // Load subscription data only (profile and features are already loaded via AppDataContext)
        const [contextResponse, statusResponse, usageResponse] = await Promise.all([
          fetch("/api/subscription/context"),
          fetch("/api/app/subscription/status"),
          fetch("/api/app/subscription/usage")
        ])

        if (contextResponse.ok) {
          const data = await contextResponse.json()
          setContext(data)
        } else {
          // On error, assume no subscription
          setContext({
            state: "none",
            canAccessApp: false,
            canPublish: false,
            trialEndsAt: null
          })
        }

        if (statusResponse.ok) {
          const status = await statusResponse.json()
          setStatusData(status)
        }

        if (usageResponse.ok) {
          const usage = await usageResponse.json()
          setUsageData(usage)
        }
      } catch (error) {
        console.error("Error loading subscription context:", error)
        setContext({
          state: "none",
          canAccessApp: false,
          canPublish: false,
          trialEndsAt: null
        })
      } finally {
        setLoading(false)
      }
    }

    loadContext()
  }, [])

  // Redirect if no subscription
  useEffect(() => {
    if (!loading && context && context.state === "none") {
      router.push("/app/select-plan")
    }
  }, [loading, context, router])

  // Show loading spinner only while loading context (required for redirect check)
  // Allow dashboard to render even if subscription data is still loading
  if (loading || !context) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Dashboard wird geladen..." />
      </div>
    )
  }

  // Don't render dashboard if no subscription (redirect will happen)
  if (context.state === "none") {
    return null
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
        Willkommen zurück, {session?.user?.name || session?.user?.email}!
      </p>

      {/* Subscription Usage Card (includes Trial Banner) - Pass preloaded data */}
      <div style={{ marginBottom: "2rem" }}>
        <SubscriptionUsageCard 
          statusData={statusData}
          usageData={usageData}
        />
      </div>

      {/* Dashboard-Kacheln: Reihenfolge entspricht Sidebar-Reihenfolge */}
      <DashboardGrid>
        {/* 1. Produktpass erstellen (entspricht Sidebar-Reihenfolge) */}
        <DashboardCard
          href="/app/create"
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
          description="Erstellen Sie einen neuen Digitalen Produktpass für Ihr Produkt."
        />

        {/* 2. Produktpässe verwalten (entspricht Sidebar-Reihenfolge) */}
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
          description="Verwalten Sie alle Ihre Digitalen Produktpässe an einem Ort."
        />

        {/* 3. Organisation (für ORG_ADMIN und ORG_OWNER) - entspricht Sidebar-Reihenfolge */}
        {(userRole === "ORG_ADMIN" || userRole === "ORG_OWNER") && (
          <DashboardCard
            href="/app/organization"
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
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
            title="Organisation"
            description="Verwalten Sie Ihre Organisationsdaten, Benutzer und Einstellungen."
          />
        )}

        {/* 4. Meine Daten (entspricht Sidebar-Reihenfolge) */}
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

        {/* 5. Audit Log (nur wenn Feature verfügbar) - entspricht Sidebar-Reihenfolge */}
        {availableFeatures.includes("audit_logs") && (
          <DashboardCard
            href="/app/audit-logs"
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
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
            title="Audit Logs"
            description="Unveränderliche Historie aller Compliance-relevanten und AI-gestützten Aktionen."
          />
        )}
      </DashboardGrid>
    </div>
  )
}

