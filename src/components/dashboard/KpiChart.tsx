"use client";

import { useState, useCallback, useId, useEffect, useRef } from "react";
import type { KpiId } from "./DashboardKpiCard";

const MOBILE_BREAKPOINT = 480;
const MIN_CHART_WIDTH = 600;

export interface KpiTimeSeries {
  dates: string[];
  current: { created: number[]; published: number[]; scans: number[] };
  previous: { created: number[]; published: number[]; scans: number[] };
}

const CHART_HEIGHT = 280;
const PADDING = { top: 16, right: 16, bottom: 44, left: 36 };

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
    centered?: boolean;
    left?: number;
    top?: number;
    date: string;
    current: number;
    previous: number;
    /** Exakte X-Position in ViewBox-Koordinaten (stufenlose Hilfslinie) */
    hoverX?: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [chartWidth, setChartWidth] = useState(MIN_CHART_WIDTH);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`) : null;
    const handler = () => setIsMobile(mq?.matches ?? false);
    handler();
    mq?.addEventListener("change", handler);
    return () => mq?.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect?.width != null && rect.width > 0) {
        setChartWidth(Math.max(Math.round(rect.width), MIN_CHART_WIDTH));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = chartWidth;
  const innerW = w - PADDING.left - PADDING.right;
  const h = CHART_HEIGHT;
  const innerH = h - PADDING.top - PADDING.bottom;

  const TOOLTIP_PADDING = 16;
  const TOOLTIP_APPROX_WIDTH = 260;

  const key = kpiId === "avgScans" ? "scans" : METRIC_KEYS[kpiId];
  const hasData = Boolean(timeSeries?.dates?.length);
  const current = hasData ? timeSeries!.current[key] : [];
  const previous = hasData ? timeSeries!.previous[key] : [];
  const dates = hasData ? timeSeries!.dates : [];
  const nCurrent = current.length;
  const nPrevious = previous.length;

  const updateTooltipFromPosition = useCallback(
    (clientX: number, clientY: number, idx: number, hoverXViewBox: number) => {
      if (idx < 0 || !dates[idx]) return;
      const vp =
        typeof window !== "undefined" && window.visualViewport
          ? { w: window.visualViewport.width }
          : null;
      const w = vp ? vp.w : (typeof window !== "undefined" ? window.innerWidth : 400);
      const isMobile = w < MOBILE_BREAKPOINT;
      const base = {
        date: dates[idx],
        current: current[idx] ?? 0,
        previous: previous[Math.min(idx, nPrevious - 1)] ?? 0,
        hoverX: hoverXViewBox,
      };
      if (isMobile) {
        setTooltip({ centered: true, ...base });
        return;
      }
      const h =
        typeof window !== "undefined" && window.visualViewport
          ? window.visualViewport.height
          : (typeof window !== "undefined" ? window.innerHeight : 600);
      const left = Math.max(TOOLTIP_PADDING, Math.min(clientX + TOOLTIP_PADDING, w - TOOLTIP_APPROX_WIDTH));
      const top = Math.max(TOOLTIP_PADDING, Math.min(clientY + 8, h - 180));
      setTooltip({ centered: false, left, top, ...base });
    },
    [dates, current, previous, nPrevious]
  );

  /** pixelX = x relativ zur linken Kante des Containers. ViewBox mit xMidYMid meet. */
  const pixelToViewBoxX = useCallback((pixelX: number, rect: DOMRect) => {
    const scale = Math.min(rect.width / w, rect.height / CHART_HEIGHT);
    const offsetX = (rect.width - w * scale) / 2;
    return (pixelX - offsetX) / scale;
  }, [w]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (nCurrent === 0 || dates.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pixelX = e.clientX - rect.left;
      const hoverXViewBox = Math.max(PADDING.left, Math.min(w - PADDING.right, pixelToViewBoxX(pixelX, rect)));
      const percent = Math.max(0, Math.min(1, (hoverXViewBox - PADDING.left) / innerW));
      const fracIdx = percent * (nCurrent - 1);
      const idx = Math.min(
        Math.max(0, Math.floor(fracIdx)),
        nCurrent - 1
      );
      updateTooltipFromPosition(e.clientX, e.clientY, idx, hoverXViewBox);
    },
    [dates, nCurrent, updateTooltipFromPosition, pixelToViewBoxX, w, innerW]
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (nCurrent === 0 || dates.length === 0 || !e.touches[0]) return;
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pixelX = touch.clientX - rect.left;
      const hoverXViewBox = Math.max(PADDING.left, Math.min(w - PADDING.right, pixelToViewBoxX(pixelX, rect)));
      const percent = Math.max(0, Math.min(1, (hoverXViewBox - PADDING.left) / innerW));
      const fracIdx = percent * (nCurrent - 1);
      const idx = Math.min(Math.max(0, Math.floor(fracIdx)), nCurrent - 1);
      updateTooltipFromPosition(touch.clientX, touch.clientY, idx, hoverXViewBox);
    },
    [dates, nCurrent, updateTooltipFromPosition, pixelToViewBoxX, w, innerW]
  );

  const handleTouchEnd = useCallback(() => setTooltip(null), []);

  const clipId = useId();

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

  return (
    <div
      style={{
        padding: "20px 24px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        position: "relative",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: "500",
          color: "#64748b",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div ref={chartRef} style={{ width: "100%", minWidth: 0 }}>
        <svg
          width="100%"
          height={CHART_HEIGHT}
          viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              fontSize={isMobile ? 20 : 13}
            >
              {v}
            </text>
          </g>
        ))}
        {/* X: wie Statistik-Seite – Abstand zur Achse, erstes Label vom Schnittpunkt abgerückt */}
        {xTickIndices.map((i) => (
          <text
            key={i}
            x={i === 0 ? toXCurrent(i) + 10 : toXCurrent(i)}
            y={h - 20}
            textAnchor="middle"
            fill="#64748b"
            fontSize={isMobile ? 20 : 13}
          >
            {formatDate(dates[i])}
          </text>
        ))}
        <g clipPath={`url(#${clipId})`}>
          <path
            d={previousPath}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={currentPath}
            fill="none"
            stroke="#24c598"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {tooltip && tooltip.hoverX != null && (() => {
            const idx = dates.indexOf(tooltip.date);
            if (idx < 0) return null;
            const x = tooltip.hoverX;
            const fracIdx = Math.max(0, Math.min(nCurrent - 1, (x - PADDING.left) / innerW * (nCurrent - 1)));
            const i0 = Math.floor(fracIdx);
            const i1 = Math.min(i0 + 1, nCurrent - 1);
            const t = fracIdx - i0;
            const value = (current[i0] ?? 0) * (1 - t) + (current[i1] ?? 0) * t;
            const cy = toY(value);
            return (
              <g>
                <line
                  x1={x}
                  y1={PADDING.top}
                  x2={x}
                  y2={PADDING.top + innerH}
                  stroke="#9CA3AF"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x}
                  cy={cy}
                  r={4}
                  fill="#24c598"
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              </g>
            );
          })()}
        </g>
      </svg>
      </div>
      {tooltip && (() => {
        const pct =
          tooltip.previous === 0
            ? (tooltip.current > 0 ? 100 : 0)
            : Math.round(((tooltip.current - tooltip.previous) / tooltip.previous) * 100);
        const pctPositive = pct >= 0;
        const content = (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fff",
              color: "#0f172a",
              fontSize: "0.75rem",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              pointerEvents: "none",
              minWidth: 180,
              maxWidth: "calc(100vw - 32px)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#24c598",
                  flexShrink: 0,
                }}
              />
              <span>{formatDateLong(tooltip.date)}</span>
              <span style={{ fontWeight: 500 }}>{tooltip.current}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  color: pctPositive ? "#24c598" : "#dc2626",
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
                  backgroundColor: "#64748b",
                  flexShrink: 0,
                }}
              />
              <span>Vorperiode: {tooltip.previous}</span>
            </div>
          </div>
        );
        return tooltip.centered ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
            }}
          >
            {content}
          </div>
        ) : (
          <div
            style={{
              position: "fixed",
              left: tooltip.left ?? 0,
              top: tooltip.top ?? 0,
              zIndex: 9999,
            }}
          >
            {content}
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
          fontSize: "0.8125rem",
          color: "#64748b",
        }}
      >
        {dates.length > 0 && (
          <div style={{ textAlign: "center" }}>
            {formatDateLong(dates[0])}–{formatDateLong(dates[dates.length - 1])}
          </div>
        )}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={24} height={8} style={{ flexShrink: 0 }}>
              <line x1={0} y1={4} x2={24} y2={4} stroke="#24c598" strokeWidth={2} strokeLinecap="round" />
            </svg>
            Aktueller Zeitraum
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={24} height={8} style={{ flexShrink: 0 }}>
              <line x1={0} y1={4} x2={24} y2={4} stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 4" strokeLinecap="round" />
            </svg>
            Vorperiode
          </span>
        </div>
      </div>
    </div>
  );
}
