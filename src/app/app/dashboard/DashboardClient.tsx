"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
  const [context, setContext] = useState<SubscriptionContext | null>(null)
  const [statusData, setStatusData] = useState<SubscriptionStatus | null>(null)
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionDataLoaded, setSubscriptionDataLoaded] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function loadContext() {
      try {
        // Load all subscription data and user role in parallel for better performance
        const [contextResponse, statusResponse, usageResponse, profileResponse] = await Promise.all([
          fetch("/api/subscription/context"),
          fetch("/api/app/subscription/status"),
          fetch("/api/app/subscription/usage"),
          fetch("/api/app/profile")
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

        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          setUserRole(profile.user?.role || null)
        }

        // Mark subscription data as loaded
        setSubscriptionDataLoaded(true)
      } catch (error) {
        console.error("Error loading subscription context:", error)
        setContext({
          state: "none",
          canAccessApp: false,
          canPublish: false,
          trialEndsAt: null
        })
        setSubscriptionDataLoaded(true)
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

  // Show loading spinner while loading context and subscription data
  if (loading || !context || !subscriptionDataLoaded) {
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

      {/* Dashboard-Kacheln: 3 Spalten auf Desktop, 1 Spalte auf Mobile */}
      <DashboardGrid>
        {/* Organisation (nur für ORG_ADMIN) */}
        {userRole === "ORG_ADMIN" && (
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            title="Organisation"
            description="Verwalten Sie Ihre Organisationsdaten, Benutzer und Einstellungen."
          />
        )}

        {/* 1. Produktpass erstellen */}
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
          description="Verwalten Sie alle Ihre Digitalen Produktpässe an einem Ort."
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

        {/* 4. Audit Log */}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          }
          title="Audit Log"
          description="Unveränderliche Historie aller Compliance-relevanten und AI-gestützten Aktionen."
        />
      </DashboardGrid>
    </div>
  )
}

