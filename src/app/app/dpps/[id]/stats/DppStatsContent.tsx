"use client"

import { useState, useEffect, useMemo } from "react"
import { BREAKPOINTS_MQ } from "@/lib/breakpoints"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import StatsAnalysisCard from "@/components/stats/StatsAnalysisCard"
import { StatsUsageIcon, StatsSurveyIcon } from "@/components/stats/StatsIcons"
import StatsExpandedUsage, { generateScanDataFromTotal } from "@/components/stats/StatsExpandedUsage"
import SurveyResultsBlock from "@/components/stats/SurveyResultsBlock"

interface SurveyQuestion {
  question: string
  options: Array<{ option: string; count: number; percentage: number }>
}

interface Survey {
  pollBlockId: string
  title: string
  totalVotes: number
  questions: SurveyQuestion[]
}

interface StatsData {
  dpp: { id: string; name: string; status: string }
  usage: {
    totalScans: number
    topRegions?: Array<{ region: string; scans: number }>
    scanTimeSeries?: Array<{ date: string; scans: number }>
  }
  surveys: Survey[]
}

export default function DppStatsContent({ dppId }: { dppId: string }) {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.appMobile)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const scanData = useMemo(() => {
    if (!data?.usage) return []
    const series = data.usage.scanTimeSeries
    if (series?.length) return series
    return generateScanDataFromTotal(data.usage.totalScans)
  }, [data?.usage?.totalScans, data?.usage?.scanTimeSeries])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/app/dpp/${dppId}/stats`)
        if (!res.ok) {
          if (res.status === 403) {
            setError("Kein Zugriff auf die Statistiken")
            return
          }
          setError("Fehler beim Laden")
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setError("Fehler beim Laden")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dppId])

  if (loading) {
    return <LoadingSpinner message="Statistiken werden geladen..." />
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 0 64px" }}>
        <p style={{ color: "#7A7A7A", marginBottom: "1rem" }}>{error || "Fehler beim Laden"}</p>
        <Link
          href="/app/dpps"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
          }}
        >
          ← Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  const statusLabel = data.dpp.status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"
  const statusColor = data.dpp.status === "PUBLISHED" ? "#00A651" : "#7A7A7A"

  const statsContainer = {
    maxWidth: "1000px",
    margin: "0 auto" as const,
    padding: "0 0 64px",
  }
  const statsHeader = { marginBottom: isMobile ? 16 : 32 }
  const statsCards = {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: isMobile ? 20 : 32,
  }

  const handleCardToggle = (id: string) => {
    if (isMobile) {
      setExpandedCardId((prev) => (prev === id ? null : id))
    }
  }
  const totalVotes = data.surveys.reduce((sum, s) => sum + s.totalVotes, 0)
  const interactions = data.usage.totalScans + totalVotes

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
        kpiValue={
          data.usage.totalScans === 0 ? (
            <span style={{ color: "#7A7A7A", fontSize: 15 }}>Noch keine Scans</span>
          ) : (
            data.usage.totalScans.toLocaleString("de-DE")
          )
        }
        kpiMeta={
          data.usage.totalScans === 0 ? undefined : (
            <>Scans</>
          )
        }
        expandedContent={
          data.usage.totalScans === 0 ? null : (
            <StatsExpandedUsage
              scanData={scanData}
              totalScans={data.usage.totalScans}
              totalVotes={totalVotes}
              topRegions={data.usage.topRegions ?? []}
            />
          )
        }
      />

      <StatsAnalysisCard
        cardId="survey"
        title="Umfrage"
        icon={<StatsSurveyIcon size={18} />}
        defaultExpanded={false}
        expanded={isMobile ? expandedCardId === "survey" : undefined}
        onToggle={isMobile ? () => handleCardToggle("survey") : undefined}
        kpiValue={
          data.surveys.length === 0 ? (
            <span style={{ color: "#7A7A7A", fontSize: 15 }}>Noch keine Antworten</span>
          ) : (
            totalVotes.toLocaleString("de-DE")
          )
        }
        kpiMeta={
          data.surveys.length === 0 ? undefined : (
            <>Stimmen gesamt · {data.surveys.length} {data.surveys.length === 1 ? "Umfrage" : "Umfragen"}</>
          )
        }
        expandedContent={
          data.surveys.length === 0 ? null : (
            <>
              {data.surveys.map((survey, surveyIdx) => (
                <div key={survey.pollBlockId} style={{ marginTop: surveyIdx > 0 ? 40 : 0 }} className="section-block">
                  <p
                    className="poll-question-title"
                    style={{ fontSize: 16, fontWeight: 600, color: "#0A0A0A", margin: "0 0 4px 0" }}
                  >
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
          )
        }
      />
      </div>
    </div>
  )
}
