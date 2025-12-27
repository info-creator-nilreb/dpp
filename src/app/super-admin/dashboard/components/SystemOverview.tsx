"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TimeFilter, { getDateRange } from "./TimeFilter";
import KPICard from "./KPICard";
import SubscriptionBreakdown from "./SubscriptionBreakdown";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface KPIData {
  organizations: number;
  activeUsers: number;
  activeDpps: number;
  dppScans: number;
  subscriptions: {
    trial: number;
    basic: number;
    pro: number;
    premium: number;
  };
}

/**
 * System Overview Component
 * 
 * Primary entry point showing central KPIs with global time filter
 */
export default function SystemOverview() {
  const searchParams = useSearchParams();
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = (searchParams.get("range") as any) || "30days";
  const customStart = searchParams.get("start") || "";
  const customEnd = searchParams.get("end") || "";

  const fetchKPIs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("range", range);
      if (range === "custom" && customStart && customEnd) {
        params.set("start", customStart);
        params.set("end", customEnd);
      }

      const response = await fetch(`/api/super-admin/dashboard/kpis?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Fehler beim Laden der KPIs");
      }

      const data = await response.json();
      setKpiData(data);
    } catch (err: any) {
      console.error("Error fetching KPIs:", err);
      setError(err.message || "Fehler beim Laden der KPIs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, [range, customStart, customEnd]);

  if (loading) {
    return (
      <div style={{ marginBottom: "4rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1.5rem",
            }}
          >
            Systemüberblick
          </h2>
          <TimeFilter />
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !kpiData) {
    return (
      <div style={{ marginBottom: "4rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "1.5rem",
            }}
          >
            Systemüberblick
          </h2>
          <TimeFilter />
        </div>
        <div
          style={{
            backgroundColor: "#FFF5F5",
            border: "1px solid #FCC",
            borderRadius: "8px",
            padding: "1.5rem",
            color: "#DC3545",
          }}
        >
          {error || "Fehler beim Laden der KPIs"}
        </div>
      </div>
    );
  }

  return (
    <section style={{ marginBottom: "4rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "1.5rem",
          }}
        >
          Systemüberblick
        </h2>
        <TimeFilter />
      </div>

      {/* Primary KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <KPICard
          label="Organisationen"
          value={kpiData.organizations}
          href="/super-admin/organizations"
        />
        <KPICard
          label="Aktive Nutzer"
          value={kpiData.activeUsers}
          href="/super-admin/users"
        />
        <KPICard
          label="Aktive DPPs"
          value={kpiData.activeDpps}
          href="/super-admin/dpps"
        />
        <KPICard label="DPP-Scans" value={kpiData.dppScans} />
      </div>

      {/* Secondary KPI: Subscription Breakdown */}
      <div style={{ maxWidth: "400px" }}>
        <SubscriptionBreakdown subscriptions={kpiData.subscriptions} />
      </div>
    </section>
  );
}

