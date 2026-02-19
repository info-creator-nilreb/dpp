"use client";

import ChevronIcon from "./ChevronIcon";

export type KpiId = "created" | "published" | "scans" | "avgScans";

export interface DashboardKpiCardProps {
  id: KpiId;
  label: string;
  value: number | string;
  /** Previous period value – used for trend and to show "–" when no data */
  previousValue?: number;
  trend?: { value: number; isPositive: boolean };
  active: boolean;
  expandable: boolean;
  onSelect: () => void;
}

/**
 * Trend display: – when no previous data, 0% neutral (no arrow), else ↑/↓ with color.
 */
function TrendDisplay({
  trend,
  previousValue,
  currentValue,
}: {
  trend?: { value: number; isPositive: boolean };
  previousValue?: number;
  currentValue: number;
}) {
  const noPreviousData =
    previousValue === undefined || (previousValue === 0 && currentValue === 0);
  if (noPreviousData) {
    return <span style={trendMuted}>–</span>;
  }
  if (trend === undefined || trend.value === 0) {
    return <span style={trendNeutral}>0%</span>;
  }
  return (
    <span
      style={{
        ...trendMuted,
        color: trend.isPositive ? "#059669" : "#dc2626",
      }}
    >
      {trend.isPositive ? "↑" : "↓"} {trend.value}%
    </span>
  );
}

const trendMuted: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: "500",
};
const trendNeutral: React.CSSProperties = {
  ...trendMuted,
  color: "#64748b",
};

export default function DashboardKpiCard({
  id,
  label,
  value,
  previousValue,
  trend,
  active,
  expandable,
  onSelect,
}: DashboardKpiCardProps) {
  const numericValue = typeof value === "number" ? value : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-active={active}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "20px 16px",
        border: "1px solid",
        borderColor: active ? "#24c598" : "#e2e8f0",
        borderRadius: "8px",
        backgroundColor: active ? "#f8fafc" : "#ffffff",
        cursor: "pointer",
        transition: "background-color 200ms, border-color 200ms, box-shadow 200ms",
        minWidth: 0,
      }}
      className="dashboard-kpi-card-btn"
    >
      <div
        style={{
          fontSize: "1.75rem",
          fontWeight: "600",
          color: "#0f172a",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}
      >
        {typeof value === "number" ? value.toLocaleString("de-DE") : value}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          color: "#64748b",
          fontWeight: "400",
          marginTop: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginTop: 8,
        }}
      >
        <TrendDisplay
          trend={trend}
          previousValue={previousValue}
          currentValue={numericValue}
        />
        {expandable && (
          <ChevronIcon
            expanded={active}
            size={14}
            aria-hidden
            style={{ color: "#94a3b8" }}
          />
        )}
      </div>
      <style jsx>{`
        .dashboard-kpi-card-btn:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </button>
  );
}
