"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DashboardGrid from "@/components/DashboardGrid"
import DashboardCard from "@/components/DashboardCard"
import { useAppData } from "@/contexts/AppDataContext"
import { LoadingSpinner } from "@/components/LoadingSpinner"

export default function CreateDppContent() {
  const { availableFeatures, isLoading } = useAppData()

  const hasCsvImport = availableFeatures.includes("csv_import")
  const hasAiAnalysis = availableFeatures.includes("ai_analysis")

  if (isLoading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Wird geladen..." />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
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
        Neuen Digitalen Produktpass erstellen
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Wählen Sie eine Methode zum Erstellen Ihres Digitalen Produktpasses.
      </p>

      <DashboardGrid>
        <DashboardCard
          href="/app/create/new"
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          }
          title="Manuell eingeben"
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
                stroke="#24c598"
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
            title="CSV importieren"
            description="Importieren Sie mehrere Produkte auf einmal über eine CSV-Datei."
          />
        )}

        {/* AI Analysis - nur wenn Feature verfügbar */}
        {hasAiAnalysis && (
          <DashboardCard
            href="/app/create/ai-start"
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <circle cx="11" cy="13" r="2" />
                <path d="M16 16l-2-2" />
              </svg>
            }
            title="KI-unterstützt starten"
            description="Vorhandene Produktdaten analysieren und Pflichtfelder automatisch vorprüfen."
          />
        )}
      </DashboardGrid>
    </div>
  )
}

