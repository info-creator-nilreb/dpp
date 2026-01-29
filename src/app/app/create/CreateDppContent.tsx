"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DashboardCard from "@/components/DashboardCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"

export default function CreateDppContent() {
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeatures() {
      try {
        const response = await fetch("/api/app/features")
        if (response.ok) {
          const data = await response.json()
          setAvailableFeatures(data.features || [])
        }
      } catch (error) {
        console.error("Error loading features:", error)
      } finally {
        setLoading(false)
      }
    }
    loadFeatures()
  }, [])

  const hasAiAnalysis = availableFeatures.includes("ai_analysis")
  const hasCsvImport = availableFeatures.includes("csv_import")

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Wird geladen..." />
      </div>
    )
  }

  return (
    <div className="create-page-container">
      {/* Navigation */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zur Übersicht
        </Link>
      </div>

      {/* Headline with entrance animation */}
      <h1 className="create-headline" style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Neuen digitalen Produktpass anlegen
      </h1>
      <p className="create-description" style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Wählen Sie, wie Sie starten möchten.
      </p>

      {/* New Layout: 1 Primary + 2 Secondary Cards */}
      <div className="create-cards-grid">
        {/* Primary Card - KI-unterstützt (groß) - nur wenn Feature verfügbar */}
        {hasAiAnalysis && (
          <div className="create-primary-card">
            <DashboardCard
              href="/app/create/ai-start"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="#24c598"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <circle cx="11" cy="13" r="2" />
                  <path d="M16 16l-2-2" />
                </svg>
              }
              title="KI-unterstützt starten"
              description="Vorhandene Produktdaten analysieren und Pflichtfelder automatisch vorprüfen."
            >
              <div className="recommended-badge">
                Empfohlen
              </div>
            </DashboardCard>
          </div>
        )}

        {/* Secondary Cards Container */}
        <div className="create-secondary-cards">
          <DashboardCard
            href="/app/create/new"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="#7A7A7A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
            title="Manuell starten"
            description="Erstellen Sie einen neuen Digitalen Produktpass Schritt für Schritt mit dem Formular."
          />

          {/* CSV Import - nur wenn Feature verfügbar */}
          {hasCsvImport && (
            <DashboardCard
              href="/app/create/import"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="#7A7A7A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              }
              title="Per CSV importieren"
              description="Importieren Sie mehrere Produkte auf einmal über eine CSV-Datei."
            />
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          /* =========================================================
   BASIS-STYLES – gelten für Mobile & Desktop
   ========================================================= */

.create-cards-grid {
  display: grid !important;
  gap: 1.5rem !important;
  margin-bottom: 2rem;
  align-items: stretch !important;
}

/* Primary Card Wrapper */
.create-primary-card {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
}

/* >>> KRITISCHER FIX <<< */
/* Das <a> MUSS ein flex:1-Item sein */
.create-primary-card :global(> a),
.create-primary-card :global(a) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-height: 100% !important;
}

/* Innerer Card-Container */
.create-primary-card :global(> a > div) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  height: 100% !important;
}

/* Secondary Cards – gleiche Höhenkette */
.create-secondary-cards :global(> a),
.create-secondary-cards :global(a) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-height: 100% !important;
}

.create-secondary-cards :global(> a > div) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  height: 100% !important;
}

/* =========================================================
   MOBILE LAYOUT (max-width: 767px)
   ========================================================= */

@media (max-width: 767px) {
  .create-cards-grid {
    grid-template-columns: 1fr !important;
    grid-auto-rows: 1fr !important; /* gleiche Höhen */
  }

  /* Secondary Cards fließen als normale Grid-Items */
  .create-secondary-cards {
    display: contents !important;
  }
}

/* =========================================================
   DESKTOP LAYOUT (min-width: 768px)
   ========================================================= */

@media (min-width: 768px) {
  .create-cards-grid {
    grid-template-columns: 2fr 1fr !important;
    align-items: stretch !important;
  }

  /* Primary Card muss die volle Höhe des Grid-Items nutzen */
  .create-primary-card {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    min-height: 100% !important;
  }

  .create-secondary-cards {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 1.5rem !important;
    align-items: stretch !important;
    height: 100% !important;
    min-height: 100% !important;
  }
}

        `
      }} />
      <style jsx>{`
        .create-page-container {
          animation: fadeInUp 0.2s ease-out;
        }

        .create-headline {
          animation: fadeInUp 0.2s ease-out 0.05s both;
        }

        .create-description {
          animation: fadeInUp 0.2s ease-out 0.1s both;
        }

        .create-cards-grid {
          animation: fadeInUp 0.2s ease-out 0.15s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .create-primary-card :global(div) {
          background: linear-gradient(135deg, #FFFFFF 0%, #FEF3F2 100%);
        }


        .create-secondary-cards :global(a > div:hover) {
          background-color: #F5F5F5;
        }

        .recommended-badge {
          margin-top: 1rem;
          display: inline-block;
          padding: 0.375rem 0.75rem;
          background-color: rgba(36, 197, 152, 0.22);
          border-radius: 6px;
          font-size: clamp(0.8rem, 1.8vw, 0.9rem);
          font-weight: 500;
          color: #7A1248;
          width: fit-content;
        }

        @media (min-width: 768px) {
          .recommended-badge {
            background-color: rgba(36, 197, 152, 0.06);
    
          }
        }
      `}</style>
    </div>
  )
}

