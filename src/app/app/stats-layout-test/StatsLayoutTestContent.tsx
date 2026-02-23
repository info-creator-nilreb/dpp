"use client"

import { useMemo, useState, useEffect } from "react"
import { BREAKPOINTS_MQ } from "@/lib/breakpoints"
import Link from "next/link"
import StatsAnalysisCard from "@/components/stats/StatsAnalysisCard"
import { StatsUsageIcon, StatsSurveyIcon } from "@/components/stats/StatsIcons"
import StatsExpandedUsage, { generateScanDataFromTotal } from "@/components/stats/StatsExpandedUsage"
import SurveyResultsBlock from "@/components/stats/SurveyResultsBlock"

/**
 * Testseite für das Statistik-Layout mit Dummy-Werten.
 * Route: /app/stats-layout-test
 */
const DUMMY_DATA = {
  dpp: { id: "test", name: "Bio-Baumwoll T-Shirt Classic", status: "PUBLISHED" as const },
  usage: {
    totalScans: 1247,
    interactions: 1729,
    percentChange: 18,
    topRegions: [
      { region: "Deutschland", scans: 624 },
      { region: "Österreich", scans: 374 },
      { region: "Schweiz", scans: 249 },
    ],
  },
  surveys: [
    {
      pollBlockId: "poll-1",
      title: "Welche Eigenschaft ist am wichtigsten?",
      totalVotes: 214,
      questions: [
        {
          question: "Welche Eigenschaft ist am wichtigsten?",
          options: [
            { option: "Nachhaltigkeit", count: 90, percentage: 42 },
            { option: "Design", count: 60, percentage: 28 },
            { option: "Preis", count: 32, percentage: 15 },
            { option: "Herkunft", count: 32, percentage: 15 },
          ],
        },
      ],
    },
    {
      pollBlockId: "poll-2",
      title: "Wie zufrieden sind Sie mit dem Produkt?",
      totalVotes: 156,
      questions: [
        {
          question: "Wie zufrieden sind Sie mit dem Produkt?",
          options: [
            { option: "Sehr zufrieden", count: 98, percentage: 63 },
            { option: "Zufrieden", count: 42, percentage: 27 },
            { option: "Neutral", count: 12, percentage: 8 },
            { option: "Unzufrieden", count: 4, percentage: 2 },
          ],
        },
        {
          question: "Würden Sie das Produkt weiterempfehlen?",
          options: [
            { option: "Ja, auf jeden Fall", count: 78, percentage: 50 },
            { option: "Eher ja", count: 52, percentage: 33 },
            { option: "Vielleicht", count: 18, percentage: 12 },
            { option: "Eher nicht", count: 8, percentage: 5 },
          ],
        },
      ],
    },
  ],
}

export default function StatsLayoutTestContent() {
  const data = DUMMY_DATA
  const [isMobile, setIsMobile] = useState(false)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.appMobile)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const statusLabel = data.dpp.status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"
  const statusColor = data.dpp.status === "PUBLISHED" ? "#00A651" : "#7A7A7A"

  const statsContainer = { maxWidth: "1000px", margin: "0 auto" as const, padding: "0 0 64px" }
  const statsHeader = { marginBottom: isMobile ? 16 : 32 }
  const statsCards = {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: isMobile ? 20 : 32,
  }

  const handleCardToggle = (id: string) => {
    if (isMobile) setExpandedCardId((prev) => (prev === id ? null : id))
  }
  const totalVotes = data.surveys.reduce((sum, s) => sum + s.totalVotes, 0)
  const interactions = (data.usage as { totalScans: number; interactions?: number }).interactions ?? data.usage.totalScans + totalVotes
  const percentChange = (data.usage as { percentChange?: number }).percentChange
  const scanData = useMemo(() => generateScanDataFromTotal(data.usage.totalScans), [data.usage.totalScans])

  return (
    <div className="stats-page" style={statsContainer}>
      <style>{`
        @media (max-width: 768px) {
          .stats-page .page-title { font-size: 22px !important; margin-bottom: 6px !important; }
          .stats-page .status-badge { font-size: 14px !important; margin-bottom: 16px !important; }
          .stats-page .stats-card { margin-bottom: 20px; }
        }
      `}</style>
      <header style={statsHeader}>
        <Link
          href="/app/dpps"
          style={{
            display: "inline-block",
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: 16,
          }}
        >
          ← Zurück zur Übersicht
        </Link>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#999",
            margin: "0 0 8px 0",
          }}
        >
          [Layout-Test mit Dummy-Werten]
        </p>
        <h1 className="page-title" style={{ fontSize: "1.5rem", fontWeight: 600, color: "#0A0A0A", margin: "0 0 4px 0" }}>
          {data.dpp.name}
        </h1>
        <span className="status-badge" style={{ color: statusColor, fontWeight: 500, fontSize: "0.9rem", display: "block" }}>
          {statusLabel}
        </span>
      </header>

      <div style={statsCards}>
      <StatsAnalysisCard
        cardId="usage"
        title="Nutzung"
        icon={<StatsUsageIcon size={18} />}
        defaultExpanded={false}
        expanded={isMobile ? expandedCardId === "usage" : undefined}
        onToggle={isMobile ? () => handleCardToggle("usage") : undefined}
        kpiValue={data.usage.totalScans.toLocaleString("de-DE")}
        kpiMeta={<>Scans</>}
        kpiGrowth={
          percentChange != null ? (
            <span style={{ color: percentChange >= 0 ? "#059669" : "#dc2626" }}>
              {percentChange >= 0 ? "+" : ""}{percentChange} % vs. Vormonat
            </span>
          ) : undefined
        }
        expandedContent={
          <StatsExpandedUsage
            scanData={scanData}
            totalScans={data.usage.totalScans}
            totalVotes={totalVotes}
            topRegions={data.usage.topRegions ?? []}
          />
        }
      />

      <StatsAnalysisCard
        cardId="survey"
        title="Umfrage"
        icon={<StatsSurveyIcon size={18} />}
        defaultExpanded={false}
        expanded={isMobile ? expandedCardId === "survey" : undefined}
        onToggle={isMobile ? () => handleCardToggle("survey") : undefined}
        kpiValue={totalVotes.toLocaleString("de-DE")}
        kpiMeta={<>Stimmen gesamt · {data.surveys.length} Umfragen</>}
        expandedContent={
          <>
            {data.surveys.map((survey, surveyIdx) => (
              <div key={survey.pollBlockId} style={{ marginTop: surveyIdx > 0 ? 40 : 0 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#0A0A0A", margin: "0 0 4px 0" }}>
                  {survey.title}
                </p>
                {survey.questions.map((q, qIdx) => {
                  const questionTotal = q.options.reduce((s, o) => s + o.count, 0)
                  const questionText = q.question === survey.title ? "" : q.question
                  return (
                    <SurveyResultsBlock
                      key={qIdx}
                      question={questionText}
                      totalVotes={questionTotal}
                      options={q.options}
                      noTopMargin={qIdx === 0}
                    />
                  )
                })}
              </div>
            ))}
          </>
        }
      />
      </div>
    </div>
  )
}
