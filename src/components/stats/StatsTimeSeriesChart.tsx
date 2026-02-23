"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { BREAKPOINTS_MQ } from "@/lib/breakpoints"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipContentProps,
} from "recharts"

export interface ScanDataPoint {
  date: string
  scans: number
}

export interface RegionalSeries {
  region: string
  color: string
  data: ScanDataPoint[]
}

interface StatsTimeSeriesChartProps {
  data: ScanDataPoint[]
  /** Regionale Kurven (Mehrfachauswahl) – jede als eigene Linie in eigener Farbe */
  regionalSeries?: RegionalSeries[]
  /** Farbe der Gesamt-Linie (unterschiedlich zu Top1-Region) */
  gesamtColor?: string
}

function formatDate(s: string): string {
  const d = new Date(s)
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" })
}

function formatDateLong(s: string): string {
  const d = new Date(s)
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/** Tooltip für Basis-Kurve oder mehrere Regionen */
function CustomTooltip({
  active,
  payload,
  onActiveChange,
}: TooltipContentProps<number, string> & { onActiveChange?: (active: boolean) => void }) {
  useEffect(() => {
    onActiveChange?.(!!active && !!payload?.length)
  }, [active, payload?.length, onActiveChange])
  if (!active || !payload?.length) return null
  const first = payload[0].payload as Record<string, unknown>
  const date = first.date as string

  return (
    <div
      style={{
        padding: "12px 16px",
        backgroundColor: "#fff",
        color: "#0f172a",
        fontSize: "0.8125rem",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        pointerEvents: "none",
        minWidth: 140,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{formatDateLong(date)}</div>
      {payload.map((p) => (
        <div
          key={p.dataKey as string}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: p.color ?? "#24c598",
              flexShrink: 0,
            }}
          />
          <span>{p.name}</span>
          <span style={{ fontWeight: 500 }}>{(p.value as number)?.toLocaleString("de-DE") ?? 0}</span>
        </div>
      ))}
    </div>
  )
}

const CHART_HEIGHT_DESKTOP = 240
const CHART_HEIGHT_MOBILE = 200
const CHART_HEIGHT_SMALL_MOBILE = 180
const CHART_MARGIN_DESKTOP = { top: 12, right: 36, bottom: 12, left: 40 }
const CHART_MARGIN_MOBILE = { top: 12, right: 16, bottom: 12, left: 20 }

export default function StatsTimeSeriesChart({ data, regionalSeries = [], gesamtColor = "#64748b" }: StatsTimeSeriesChartProps) {
  const hasRegional = regionalSeries.length > 0
  const [tooltipActive, setTooltipActive] = useState(false)
  const [chartKey, setChartKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallMobile, setIsSmallMobile] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.appMobile)
    const smq = window.matchMedia(BREAKPOINTS_MQ.smallMobile)
    const handler = () => {
      setIsMobile(mq.matches)
      setIsSmallMobile(smq.matches)
    }
    handler()
    mq.addEventListener("change", handler)
    smq.addEventListener("change", handler)
    return () => {
      mq.removeEventListener("change", handler)
      smq.removeEventListener("change", handler)
    }
  }, [])

  useEffect(() => {
    if (!tooltipActive) return
    const handlePointer = (e: PointerEvent) => {
      if (chartRef.current?.contains(e.target as Node)) return
      setChartKey((k) => k + 1)
      setTooltipActive(false)
    }
    document.addEventListener("pointerdown", handlePointer, true)
    return () => document.removeEventListener("pointerdown", handlePointer, true)
  }, [tooltipActive])

  const chartData = useMemo(() => {
    const base = data.map((d) => ({ ...d, dateFormatted: formatDate(d.date) }))
    if (hasRegional) {
      return base.map((row) => {
        const r: Record<string, number | string> = { ...row }
        regionalSeries.forEach((s) => {
          const pt = s.data.find((d) => d.date === row.date)
          r[s.region] = pt?.scans ?? 0
        })
        return r
      })
    }
    return base
  }, [data, hasRegional, regionalSeries])

  if (chartData.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "#94a3b8",
          backgroundColor: "transparent",
        }}
      >
        Keine Daten
      </div>
    )
  }

  return (
    <div
      ref={chartRef}
      className="chart-container"
      style={{
        padding: 0,
        backgroundColor: "transparent",
        marginTop: 8,
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        className="stats-chart-container"
        style={{
          width: "100%",
          minWidth: 0,
          height: isMobile ? (isSmallMobile ? CHART_HEIGHT_SMALL_MOBILE : CHART_HEIGHT_MOBILE) : CHART_HEIGHT_DESKTOP,
        }}
      >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          key={chartKey}
          data={chartData}
          margin={isMobile ? CHART_MARGIN_MOBILE : CHART_MARGIN_DESKTOP}
        >
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 11 }}
            axisLine={false}
            tickLine={false}
            interval={isMobile ? "preserveStart" : 0}
            minTickGap={isMobile ? 36 : 20}
          />
          <YAxis
            width={isMobile ? 20 : 40}
            tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 11 }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
            tickFormatter={(v) =>
              isMobile && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString("de-DE")
            }
          />
          <Tooltip
            content={<CustomTooltip onActiveChange={setTooltipActive} />}
            cursor={{ stroke: "#9CA3AF", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="scans"
            name="Gesamt"
            stroke={gesamtColor}
            strokeWidth={2}
            dot={false}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {regionalSeries.map((s) => (
            <Line
              key={s.region}
              type="monotone"
              dataKey={s.region}
              name={s.region}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
