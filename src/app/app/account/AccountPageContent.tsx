"use client"

import Link from "next/link"
import DashboardCard from "@/components/DashboardCard"

/**
 * Meine Daten - Übersicht mit Kacheln
 */
export function AccountPageContent() {
  return (
    <div>
      <div style={{
        marginBottom: "1rem"
      }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zum Dashboard
        </Link>
      </div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Meine Daten
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Verwalten Sie Ihre Kontoinformationen und Einstellungen.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(1, 1fr)",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}
      className="account-grid-responsive"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (min-width: 768px) {
              .account-grid-responsive {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
          `
        }} />
        {/* Persönliche Daten */}
        <DashboardCard
          href="/app/account/personal"
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
          title="Persönliche Daten"
          description="Verwalten Sie Ihre persönlichen Informationen, E-Mail-Adresse und Rolle."
        />

        {/* Sicherheitseinstellungen */}
        <DashboardCard
          href="/app/account/security"
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
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          title="Sicherheitseinstellungen"
          description="Passwort ändern und Zwei-Faktor-Authentifizierung (2FA) einrichten."
        />

        {/* Abonnement */}
        <DashboardCard
          href="/app/account/subscription"
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
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          }
          title="Abonnement"
          description="Verwalten Sie Ihr Abonnement, Plan-Details und Upgrades."
        />
      </div>
    </div>
  )
}
