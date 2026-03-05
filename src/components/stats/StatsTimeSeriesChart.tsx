"use client"

import { useMemo, useState, useRef, useEffect, useCallback, useId } from "react"
import { BREAKPOINTS_MQ } from "@/lib/breakpoints"

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

/** Exakt gleiche Konstanten und Kurvenlogik wie im Dashboard (KpiChart). */
const CHART_HEIGHT = 280
const PADDING = { top: 16, right: 16, bottom: 44, left: 36 }
const MIN_CHART_WIDTH = 600
const INNER_H = CHART_HEIGHT - PADDING.top - PADDING.bottom

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

/** Build smooth cubic Bézier path through points (Catmull-Rom style) – exakt wie im Dashboard. */
function pointsToSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  const n = points.length
  const p = (i: number) => points[Math.max(0, Math.min(i, n - 1))]
  const parts: string[] = [`M ${p(0).x} ${p(0).y}`]
  const tension = 1 / 6
  for (let i = 0; i < n - 1; i++) {
    const c1x = p(i).x + (p(i + 1).x - p(i - 1).x) * tension
    const c1y = p(i).y + (p(i + 1).y - p(i - 1).y) * tension
    const c2x = p(i + 1).x - (p(i + 2).x - p(i).x) * tension
    const c2y = p(i + 1).y - (p(i + 2).y - p(i).y) * tension
    parts.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p(i + 1).x} ${p(i + 1).y}`)
  }
  return parts.join(" ")
}

function getYTicks(max: number): number[] {
  if (max <= 0) return [0]
  const step =
    max <= 5 ? 1 : max <= 10 ? 2 : max <= 20 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : Math.ceil(max / 5)
  const ticks: number[] = [0]
  for (let v = step; v < max; v += step) ticks.push(v)
  if (max > 0 && ticks[ticks.length - 1] !== max) ticks.push(max)
  return [...new Set(ticks)].sort((a, b) => a - b)
}

function getXTickIndices(length: number): number[] {
  if (length <= 0) return []
  if (length <= 5) return Array.from({ length }, (_, i) => i)
  const count = Math.min(7, length)
  const step = (length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => Math.round(i * step))
}

const DEFAULT_GESAMT_COLOR = "#24c598"

export default function StatsTimeSeriesChart({
  data,
  regionalSeries = [],
  gesamtColor = DEFAULT_GESAMT_COLOR,
}: StatsTimeSeriesChartProps) {
  const hasRegional = regionalSeries.length > 0
  const [tooltip, setTooltip] = useState<{
    date: string
    index: number
    scans: number
    regional: { region: string; color: string; value: number }[]
    clientX: number
    clientY: number
    /** Exakte ViewBox-X für stufenlose Hilfslinie (Desktop, wie Dashboard) */
    hoverX?: number
  } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [chartWidth, setChartWidth] = useState(MIN_CHART_WIDTH)
  const chartRef = useRef<HTMLDivElement>(null)
  const clipId = useId().replace(/:/g, "")

  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.appMobile)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect?.width != null && rect.width > 0) {
        setChartWidth(Math.max(Math.round(rect.width), MIN_CHART_WIDTH))
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const W = chartWidth
  const INNER_W = W - PADDING.left - PADDING.right

  const n = data.length
  const scansValues = useMemo(() => data.map((d) => d.scans), [data])
  const allValues = useMemo(() => {
    const v = [...scansValues]
    regionalSeries.forEach((s) => {
      data.forEach((d, i) => {
        const pt = s.data.find((p) => p.date === d.date)
        v.push(pt?.scans ?? 0)
      })
    })
    return v
  }, [data, scansValues, regionalSeries])
  const max = useMemo(() => Math.max(...allValues.filter(Number.isFinite), 1), [allValues])

  const toX = useCallback(
    (i: number) => PADDING.left + (n > 1 ? (i / (n - 1)) * INNER_W : 0),
    [n, INNER_W]
  )
  const toY = useCallback((v: number) => PADDING.top + INNER_H - (v / max) * INNER_H, [max])

  const gesamtPoints = useMemo(
    () => data.map((d, i) => ({ x: toX(i), y: toY(d.scans) })),
    [data, toX, toY]
  )
  const gesamtPath = useMemo(() => pointsToSmoothPath(gesamtPoints), [gesamtPoints])

  const regionalPaths = useMemo(() => {
    return regionalSeries.map((s) => {
      const points = data.map((d, i) => {
        const pt = s.data.find((p) => p.date === d.date)
        return { x: toX(i), y: toY(pt?.scans ?? 0) }
      })
      return { region: s.region, color: s.color, path: pointsToSmoothPath(points) }
    })
  }, [data, regionalSeries, toX, toY])

  const yTicks = useMemo(() => getYTicks(max), [max])
  const xTickIndices = useMemo(() => getXTickIndices(n), [n])

  /** pixelX = x-Koordinate relativ zur linken Kante des Containers (z. B. e.clientX - rect.left). */
  const pixelToViewBoxX = useCallback((pixelX: number, rect: DOMRect) => {
    const scale = Math.min(rect.width / W, rect.height / CHART_HEIGHT)
    const offsetX = (rect.width - W * scale) / 2
    return (pixelX - offsetX) / scale
  }, [W])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (n === 0 || !chartRef.current) return
      const rect = chartRef.current.getBoundingClientRect()
      if (rect.width <= 0) return
      const viewX = Math.max(PADDING.left, Math.min(W - PADDING.right, pixelToViewBoxX(e.clientX - rect.left, rect)))
      const percent = Math.max(0, Math.min(1, (viewX - PADDING.left) / INNER_W))
      const fracIdx = percent * (n - 1)
      const idx = Math.min(Math.max(0, Math.floor(fracIdx)), n - 1)
      const row = data[idx]
      if (!row) return
      setTooltip({
        date: row.date,
        index: idx,
        scans: row.scans,
        regional: regionalSeries.map((s) => {
          const pt = s.data.find((p) => p.date === row.date)
          return { region: s.region, color: s.color, value: pt?.scans ?? 0 }
        }),
        clientX: e.clientX,
        clientY: e.clientY,
      })
    },
    [data, n, regionalSeries, pixelToViewBoxX, W, INNER_W]
  )

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontSize: "0.875rem",
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
          height: CHART_HEIGHT,
        }}
      >
        <svg
          width="100%"
          height={CHART_HEIGHT}
          viewBox={`0 0 ${W} ${CHART_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={PADDING.left} y={PADDING.top} width={INNER_W} height={INNER_H} />
            </clipPath>
          </defs>
          {/* Y: Gitterlinien + Beschriftung (ganze Zahlen) */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={PADDING.left}
                y1={toY(v)}
                x2={PADDING.left + INNER_W}
                y2={toY(v)}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={toY(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#64748b"
                fontSize={14}
              >
                {v >= 1000 && isMobile ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString("de-DE")}
              </text>
            </g>
          ))}
          {/* X: mehr Abstand zur Achse (Shopify-Style), erstes Label vom Schnittpunkt abgerückt */}
          {xTickIndices.map((i) => (
            <text
              key={i}
              x={i === 0 ? toX(i) + 10 : toX(i)}
              y={CHART_HEIGHT - 20}
              textAnchor="middle"
              fill="#64748b"
              fontSize={14}
            >
              {formatDate(data[i]?.date ?? "")}
            </text>
          ))}
          {/* Kurven (mit clipPath → nie unter 0 sichtbar) */}
          <g clipPath={`url(#${clipId})`}>
            {regionalPaths.map((r) => (
              <path
                key={r.region}
                d={r.path}
                fill="none"
                stroke={r.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            <path
              d={gesamtPath}
              fill="none"
              stroke={gesamtColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {tooltip != null && (() => {
              const x = tooltip.hoverX ?? toX(tooltip.index)
              const fracIdx = Math.max(0, Math.min(n - 1, (x - PADDING.left) / INNER_W * (n - 1)))
              const i0 = Math.floor(fracIdx)
              const i1 = Math.min(i0 + 1, n - 1)
              const t = fracIdx - i0
              const interpolatedScans = (data[i0]?.scans ?? 0) * (1 - t) + (data[i1]?.scans ?? 0) * t
              const cy = toY(interpolatedScans)
              return (
                <g>
                  <line
                    x1={x}
                    y1={PADDING.top}
                    x2={x}
                    y2={PADDING.top + INNER_H}
                    stroke="#9CA3AF"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <circle cx={x} cy={cy} r={4} fill={gesamtColor} stroke="#fff" strokeWidth={1.5} />
                </g>
              )
            })()}
          </g>
        </svg>
      </div>
      {tooltip != null && chartRef.current && (() => {
        const rect = chartRef.current.getBoundingClientRect()
        const left = Math.max(0, Math.min(tooltip.clientX - rect.left + 16, rect.width - 170))
        const top = Math.max(0, Math.min(tooltip.clientY - rect.top + 8, rect.height - 180))
        return (
        <div
          style={{
            position: "absolute",
            left,
            top,
            padding: "12px 16px",
            backgroundColor: "#fff",
            color: "#0f172a",
            fontSize: "0.875rem",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            pointerEvents: "none",
            minWidth: 140,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{formatDateLong(tooltip.date)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: gesamtColor,
                flexShrink: 0,
              }}
            />
            <span>Gesamt</span>
            <span style={{ fontWeight: 500 }}>{tooltip.scans.toLocaleString("de-DE")}</span>
          </div>
          {tooltip.regional.map((r) => (
            <div
              key={r.region}
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: r.color,
                  flexShrink: 0,
                }}
              />
              <span>{r.region}</span>
              <span style={{ fontWeight: 500 }}>{r.value.toLocaleString("de-DE")}</span>
            </div>
          ))}
        </div>
        )
      })()}
    </div>
  )
}
