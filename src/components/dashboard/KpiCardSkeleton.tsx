"use client";

/**
 * Subtle skeleton for KPI cards during timeframe change.
 * No blocking spinner – UI stays responsive.
 */
export default function KpiCardSkeleton() {
  return (
    <div
      style={{
        padding: "20px 16px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          height: 28,
          width: "40%",
          backgroundColor: "#f1f5f9",
          borderRadius: 4,
        }}
      />
      <div
        style={{
          height: 14,
          width: "60%",
          backgroundColor: "#f1f5f9",
          borderRadius: 4,
          marginTop: 12,
        }}
      />
      <div
        style={{
          height: 12,
          width: "30%",
          backgroundColor: "#f1f5f9",
          borderRadius: 4,
          marginTop: 10,
        }}
      />
    </div>
  );
}
