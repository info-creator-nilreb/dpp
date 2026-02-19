"use client";

import { useState, useCallback, useId } from "react";
import type { KpiId } from "./DashboardKpiCard";

export interface KpiTimeSeries {
  dates: string[];
  current: { created: number[]; published: number[]; scans: number[] };
  previous: { created: number[]; published: number[]; scans: number[] };
}

const CHART_HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 28, left: 36 };

const METRIC_KEYS: Record<KpiId, keyof KpiTimeSeries["current"]> = {
  created: "created",
  published: "published",
  scans: "scans",
  avgScans: "scans",
};

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
  });
}

function formatDateLong(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Build smooth cubic Bézier path through points (Catmull-Rom style) for Shopify-like curves. */
function pointsToSmoothPath(
  points: { x: number; y: number }[]
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const n = points.length;
  const p = (i: number) => points[Math.max(0, Math.min(i, n - 1))];
  const parts: string[] = [`M ${p(0).x} ${p(0).y}`];
  for (let i = 0; i < n - 1; i++) {
    const tension = 1 / 6;
    const c1x = p(i).x + (p(i + 1).x - p(i - 1).x) * tension;
    const c1y = p(i).y + (p(i + 1).y - p(i - 1).y) * tension;
    const c2x = p(i + 1).x - (p(i + 2).x - p(i).x) * tension;
    const c2y = p(i + 1).y - (p(i + 2).y - p(i).y) * tension;
    parts.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p(i + 1).x} ${p(i + 1).y}`);
  }
  return parts.join(" ");
}

const INNER_W = 600 - PADDING.left - PADDING.right;

/** Y-Achsen-Intervalle: 0 und sinnvolle Schritte bis max (z. B. 0, 1, 2 oder 0, 25, 50). */
function getYTicks(max: number): number[] {
  if (max <= 0) return [0];
  const step = max <= 5 ? 1 : max <= 10 ? 2 : max <= 20 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : Math.ceil(max / 5);
  const ticks: number[] = [0];
  for (let v = step; v < max; v += step) ticks.push(v);
  if (max > 0 && ticks[ticks.length - 1] !== max) ticks.push(max);
  return [...new Set(ticks)].sort((a, b) => a - b);
}

/** Indizes für X-Achsen-Labels: gleichmäßig verteilt, max. ~7, lesbar. */
function getXTickIndices(length: number): number[] {
  if (length <= 0) return [];
  if (length <= 5) return Array.from({ length }, (_, i) => i);
  const count = Math.min(7, length);
  const step = (length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(i * step));
}

export default function KpiChart({
  kpiId,
  timeSeries,
  label,
}: {
  kpiId: KpiId;
  timeSeries: KpiTimeSeries | null;
  label: string;
}) {
  const [tooltip, setTooltip] = useState<{
    clientX: number;
    clientY: number;
    date: string;
    current: number;
    previous: number;
  } | null>(null);

  const key = kpiId === "avgScans" ? "scans" : METRIC_KEYS[kpiId];
  const hasData = Boolean(timeSeries?.dates?.length);
  const current = hasData ? timeSeries!.current[key] : [];
  const previous = hasData ? timeSeries!.previous[key] : [];
  const dates = hasData ? timeSeries!.dates : [];
  const nCurrent = current.length;
  const nPrevious = previous.length;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (nCurrent === 0 || dates.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, (x - PADDING.left) / INNER_W));
      const idx = Math.min(
        Math.max(0, Math.round(percent * (nCurrent - 1))),
        nCurrent - 1
      );
      if (idx >= 0 && dates[idx]) {
        setTooltip({
          clientX: e.clientX,
          clientY: e.clientY,
          date: dates[idx],
          current: current[idx] ?? 0,
          previous: previous[Math.min(idx, nPrevious - 1)] ?? 0,
        });
      }
    },
    [dates, current, previous, nCurrent, nPrevious]
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  if (!timeSeries || !timeSeries.dates.length) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "#94a3b8",
        }}
      >
        Keine Daten für diesen Zeitraum.
      </div>
    );
  }

  const hasAnyData =
    current.some((v) => v > 0) || previous.some((v) => v > 0);
  if (!hasAnyData) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "#94a3b8",
        }}
      >
        Keine Daten im gewählten Zeitraum.
      </div>
    );
  }

  const max = Math.max(
    ...[...current, ...previous].filter((x) => Number.isFinite(x)),
    1
  );
  const w = 600;
  const h = CHART_HEIGHT;
  const innerW = w - PADDING.left - PADDING.right;
  const innerH = h - PADDING.top - PADDING.bottom;

  const toXCurrent = (i: number) =>
    PADDING.left + (nCurrent > 1 ? (i / (nCurrent - 1)) * innerW : 0);
  const toXPrevious = (i: number) =>
    PADDING.left + (nPrevious > 1 ? (i / (nPrevious - 1)) * innerW : 0);
  const toY = (v: number) => PADDING.top + innerH - (v / max) * innerH;

  const currentPoints = current.map((v, i) => ({
    x: toXCurrent(i),
    y: toY(v),
  }));
  const previousPoints = previous.map((v, i) => ({
    x: toXPrevious(i),
    y: toY(v),
  }));
  const currentPath = pointsToSmoothPath(currentPoints);
  const previousPath = pointsToSmoothPath(previousPoints);

  const yTicks = getYTicks(max);
  const xTickIndices = getXTickIndices(dates.length);
  const clipId = useId();

  return (
    <div
      style={{
        padding: "20px 24px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: "500",
          color: "#64748b",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PADDING.left} y={PADDING.top} width={innerW} height={innerH} />
          </clipPath>
        </defs>
        {/* Y: nur Einheiten links, keine Achsenlinie */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              y1={toY(v)}
              x2={PADDING.left + innerW}
              y2={toY(v)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 8}
              y={toY(v)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#64748b"
              fontSize="10"
            >
              {v}
            </text>
          </g>
        ))}
        {/* X: nur Datumsbeschriftung, keine Achsenlinie und keine Tick-Striche */}
        {xTickIndices.map((i) => (
          <text
            key={i}
            x={toXCurrent(i)}
            y={h - 8}
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
          >
            {formatDate(dates[i])}
          </text>
        ))}
        <g clipPath={`url(#${clipId})`}>
          <path
            d={previousPath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.25"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={currentPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {tooltip && (() => {
            const idx = dates.indexOf(tooltip.date);
            if (idx < 0) return null;
            return (
              <circle
                cx={toXCurrent(idx)}
                cy={toY(current[idx])}
                r={4}
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth={1.5}
              />
            );
          })()}
        </g>
      </svg>
      {tooltip && (() => {
        const pct =
          tooltip.previous === 0
            ? (tooltip.current > 0 ? 100 : 0)
            : Math.round(((tooltip.current - tooltip.previous) / tooltip.previous) * 100);
        const pctPositive = pct >= 0;
        return (
          <div
            style={{
              position: "fixed",
              left: tooltip.clientX + 12,
              top: tooltip.clientY + 8,
              padding: "10px 14px",
              backgroundColor: "#fff",
              color: "#0f172a",
              fontSize: "0.75rem",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              pointerEvents: "none",
              zIndex: 9999,
              minWidth: 180,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  flexShrink: 0,
                }}
              />
              <span>{formatDateLong(tooltip.date)}</span>
              <span style={{ fontWeight: 500 }}>{tooltip.current}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  color: pctPositive ? "#059669" : "#dc2626",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {pctPositive ? "↑" : "↓"} {pct} % vom Vergleich
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#94a3b8",
                  flexShrink: 0,
                }}
              />
              <span>Vorperiode: {tooltip.previous}</span>
            </div>
          </div>
        );
      })()}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          marginTop: 10,
          fontSize: "0.6875rem",
          color: "#64748b",
        }}
      >
        {dates.length > 0 && (
          <div style={{ textAlign: "center" }}>
            {formatDateLong(dates[0])}–{formatDateLong(dates[dates.length - 1])}
          </div>
        )}
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <span>— Aktueller Zeitraum</span>
          <span>— Vorperiode</span>
        </div>
      </div>
    </div>
  );
}
