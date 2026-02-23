"use client"

import { useState, useMemo, useEffect } from "react"
import { BREAKPOINTS_MQ } from "@/lib/breakpoints"
import StatsTimeSeriesChart, { type ScanDataPoint } from "@/components/stats/StatsTimeSeriesChart"

/** Farben für Regionen (indiziert; Gesamt nutzt eigene Farbe) */
const REGION_COLORS = ["#24c598", "#3B82F6", "#F59E0B"] as const

/** Farbe der Gesamt-Linie (deutlich abgesetzt von Top1) */
const GESAMT_COLOR = "#64748b"

interface StatsExpandedUsageProps {
  scanData: ScanDataPoint[]
  totalScans: number
  totalVotes: number
  /** Top-Regionen datenbasiert (API); sortiert nach scans absteigend */
  topRegions?: Array<{ region: string; scans: number }>
}

/** Generiert Demo-Scan-Daten aus totalScans (letzte 14 Tage) wenn API keine Zeitreihen liefert. */
export function generateScanDataFromTotal(totalScans: number): ScanDataPoint[] {
  if (totalScans <= 0) return []
  const days = 14
  const result: ScanDataPoint[] = []
  const now = new Date()
  let remaining = totalScans
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const isLast = i === 0
    const share = isLast ? remaining : Math.round((remaining * (0.5 + Math.random() * 0.5)) / (i + 1))
    const val = Math.min(share, remaining)
    remaining -= val
    result.push({
      date: d.toISOString().slice(0, 10),
      scans: val,
    })
  }
  return result
}

/** Verteilt scanData auf Regionen anteilig nach Scans (datenbasiert).
 * Farbe immer nach fester Reihenfolge: 1. Region = Grün, 2. = Blau, 3. = Orange (unabhängig von Auswahlreihenfolge). */
function generateRegionalData(
  scanData: ScanDataPoint[],
  topRegions: Array<{ region: string; scans: number }>,
  totalScans: number,
  selectedRegions: string[]
): Array<{ region: string; color: string; data: ScanDataPoint[] }> {
  if (totalScans <= 0) return []
  const regionsOrder = topRegions.slice(0, 3).map((r) => r.region)
  const toInclude = topRegions.filter((r) => selectedRegions.includes(r.region))
  return toInclude.map((r) => {
    const share = r.scans / totalScans
    const data: ScanDataPoint[] = scanData.map((d, i) => {
      const base = Math.round(d.scans * share)
      const variation = Math.round(d.scans * 0.03 * (i % 3 - 1))
      return { date: d.date, scans: Math.max(0, base + variation) }
    })
    const colorIdx = regionsOrder.indexOf(r.region)
    return {
      region: r.region,
      color: REGION_COLORS[colorIdx] ?? "#64748b",
      data,
    }
  })
}

/** Headline-Abstand wie im Umfrage-Bereich (8px) */
const HEADLINE_MARGIN = "0 0 8px 0"

export default function StatsExpandedUsage({
  scanData,
  totalScans,
  totalVotes,
  topRegions = [],
}: StatsExpandedUsageProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.appMobile)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const regions = useMemo(() => {
    return topRegions.slice(0, 3).map((r) => r.region)
  }, [topRegions])

  const regionalSeries = useMemo(() => {
    if (selectedRegions.length === 0 || scanData.length === 0 || topRegions.length === 0) return []
    return generateRegionalData(scanData, topRegions, totalScans, selectedRegions)
  }, [scanData, selectedRegions, topRegions, totalScans])

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    )
  }

  const getRegionColor = (region: string) => {
    const idx = regions.indexOf(region)
    return idx >= 0 ? REGION_COLORS[idx] ?? "#64748b" : "#64748b"
  }

  return (
    <div
      className="section-block"
      style={{
        marginTop: isMobile ? 20 : 32,
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 24 : 24,
        width: "100%",
        minWidth: 0,
        marginBottom: isMobile ? 24 : 0,
      }}
    >
      <div style={{ width: "100%", minWidth: 0 }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", margin: HEADLINE_MARGIN }}>
          Zeitverlauf
        </p>
        <StatsTimeSeriesChart
          data={scanData}
          regionalSeries={regionalSeries}
          gesamtColor={GESAMT_COLOR}
        />
      </div>

      {regions.length > 0 && (
        <div>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", margin: HEADLINE_MARGIN }}>
            Top 3 Regionen
          </p>
          <div
            className="region-chips"
            style={{
              display: "flex",
              flexWrap: isMobile ? "wrap" : "nowrap",
              gap: 8,
              marginTop: isMobile ? 8 : 0,
            }}
          >
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                className="region-chip"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleRegion(region)
                }}
                style={{
                  flex: isMobile ? undefined : "1 1 0",
                  minWidth: isMobile ? undefined : 0,
                  padding: isMobile ? "6px 12px" : "8px 6px",
                  minHeight: isMobile ? undefined : 44,
                  fontSize: isMobile ? 13 : "0.8125rem",
                  color: selectedRegions.includes(region) ? "#fff" : "#374151",
                  backgroundColor: selectedRegions.includes(region)
                    ? getRegionColor(region)
                    : isMobile ? "#F3F5F7" : "#E5E7EB",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  transition: "background-color 0.2s, color 0.2s",
                }}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      )}

      {regions.length === 0 && (
        <div>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", margin: HEADLINE_MARGIN }}>
            Top 3 Regionen
          </p>
          <p style={{ color: "#9CA3AF", fontSize: "0.875rem", margin: 0 }}>
            Noch keine regionalen Daten verfügbar
          </p>
        </div>
      )}
    </div>
  )
}
