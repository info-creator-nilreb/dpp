"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DashboardCard from "@/components/DashboardCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface OrganizationAccess {
  canManage: boolean
  role: string | null
}

export default function OrganizationClient() {
  const [access, setAccess] = useState<OrganizationAccess | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/app/organization/access", {
          cache: "no-store"
        })
        if (response.ok) {
          const data = await response.json()
          setAccess(data)
        }
      } catch (err) {
        console.error("Error checking access:", err)
      } finally {
        setLoading(false)
      }
    }
    checkAccess()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Lade Organisationsdaten..." />
      </div>
    )
  }

  const canManage = access?.canManage === true

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
          }}
        >
          ← Zur Übersicht
        </Link>
      </div>

      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem",
      }}>
        Organisation verwalten
      </h1>

      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem",
      }}>
        Verwalten Sie Ihre Organisationsdaten, Benutzer und Einstellungen.
      </p>

      {!canManage && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEF3C7",
          border: "1px solid #FCD34D",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#92400E"
        }}>
          Sie haben nur Leseberechtigung. Nur Organisations-Administratoren können Änderungen vornehmen.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <DashboardCard
          href="/app/organization/company-details"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="#24c598"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
          title="Firmendaten"
          description="Organisationsname, rechtliche Informationen und Adressdaten verwalten"
        />

        <DashboardCard
          href="/app/organization/billing"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="#24c598"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
            </svg>
          }
          title="Rechnungsinformationen"
          description="Rechnungsadresse und Kontaktdaten für Abrechnungen verwalten"
        />

        <DashboardCard
          href="/app/organization/users"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="#24c598"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title="Benutzer verwalten"
          description="Team-Mitglieder, Einladungen und Beitrittsanfragen verwalten"
        />
      </div>
    </div>
  )
}

