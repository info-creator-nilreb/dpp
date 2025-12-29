"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"

interface UserData {
  email?: string
  name?: string
  isPlatformAdmin?: boolean
}

interface OrganizationData {
  name: string
}

/**
 * AppNavigation - Client Component
 * 
 * Navigation bar for authenticated app routes.
 * Fetches user and organization data via API calls.
 */
export default function AppNavigation() {
  const [user, setUser] = useState<UserData | null>(null)
  const [organization, setOrganization] = useState<OrganizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [userResponse, orgResponse] = await Promise.all([
          fetch("/api/app/account", { cache: "no-store" }),
          fetch("/api/app/organizations", { cache: "no-store" })
        ])

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData)
        }

        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          if (orgData.organizations && orgData.organizations.length > 0) {
            setOrganization(orgData.organizations[0])
          }
        }
      } catch (error) {
        console.error("Error loading navigation data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      // Speichere die aktuelle URL, damit der User nach Login dorthin zurückkommt
      const currentPath = window.location.pathname
      // SignOut OHNE redirect, dann manuelle Weiterleitung mit aktueller Origin
      await signOut({ redirect: false })
      // Verwende window.location für zuverlässige Navigation mit korrektem Port und callbackUrl
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`
    } catch (error) {
      console.error("Error during logout:", error)
      // Fallback: Manuelle Weiterleitung bei Fehler
      const currentPath = window.location.pathname
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`
    }
  }

  return (
    <nav style={{
      backgroundColor: "#FFFFFF",
      borderBottom: "1px solid #CDCDCD",
      padding: "clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem)"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(1rem, 3vw, 2rem)", flexWrap: "wrap" }}>
          <Link href="/" style={{
            fontSize: "clamp(1rem, 3vw, 1.25rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                style={{ width: "100%", height: "100%" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            T-Pass
          </Link>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/app/dashboard" style={{
              color: "#0A0A0A",
              textDecoration: "none",
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              fontWeight: "500"
            }}>
              Dashboard
            </Link>
            {!loading && user?.isPlatformAdmin && (
              <Link href="/platform" style={{
                color: "#7A7A7A",
                textDecoration: "none",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "500"
              }}>
                Platform
              </Link>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {!loading && organization && (
            <span style={{ color: "#7A7A7A", fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
              {organization.name}
            </span>
          )}
          {!loading && user?.email && (
            <span style={{ color: "#7A7A7A", fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              padding: "clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)",
              backgroundColor: "transparent",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              color: "#0A0A0A",
              cursor: loggingOut ? "not-allowed" : "pointer",
              fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
              opacity: loggingOut ? 0.6 : 1
            }}
          >
            {loggingOut ? "Abmelden..." : "Abmelden"}
          </button>
        </div>
      </div>
    </nav>
  )
}

