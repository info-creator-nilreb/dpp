"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAppData } from "@/contexts/AppDataContext";
import DashboardGrid from "@/components/DashboardGrid";
import DashboardCard from "@/components/DashboardCard";
import TimeFilter from "@/components/dashboard/TimeFilter";
import DashboardKpiCard, { type KpiId } from "@/components/dashboard/DashboardKpiCard";
import KpiChart from "@/components/dashboard/KpiChart";
import KpiCardSkeleton from "@/components/dashboard/KpiCardSkeleton";
import type { SubscriptionStatus } from "@/components/SubscriptionUsageCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const SECTION_GAP = 48;
const SUBSECTION_GAP = 24;
const CHART_TO_ACTIONS_GAP = 24;

interface SubscriptionContext {
  state: "loading" | "none" | "trial" | "active";
  canAccessApp: boolean;
  canPublish: boolean;
  trialEndsAt: string | null;
}

interface DashboardAnalytics {
  kpis: {
    createdDpp: number;
    publishedDpp: number;
    scansInPeriod: number;
    avgScansPerPublishedDpp: number;
    previousPeriod: { createdDpp: number; publishedDpp: number; scansInPeriod: number };
    trend: {
      createdDpp: { value: number; isPositive: boolean };
      publishedDpp: { value: number; isPositive: boolean };
      scansInPeriod: { value: number; isPositive: boolean };
      avgScansPerPublishedDpp: { value: number; isPositive: boolean };
    };
  };
  timeSeries?: {
    dates: string[];
    current: { created: number[]; published: number[]; scans: number[] };
    previous: { created: number[]; published: number[]; scans: number[] };
  } | null;
  recentActivity?: unknown[];
  topDpps?: unknown[];
}

function daysRemaining(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const end = new Date(isoDate);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { availableFeatures } = useAppData();
  const [context, setContext] = useState<SubscriptionContext | null>(null);
  const [statusData, setStatusData] = useState<SubscriptionStatus | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeKpi, setActiveKpi] = useState<KpiId | null>(null);

  const userRole = session?.user?.role ?? null;
  const range = searchParams.get("range") || "30days";
  const customStart = searchParams.get("start") || "";
  const customEnd = searchParams.get("end") || "";

  useEffect(() => {
    async function loadContext() {
      try {
        const [contextResponse, statusResponse] = await Promise.all([
          fetch("/api/subscription/context"),
          fetch("/api/app/subscription/status"),
        ]);
        if (contextResponse.ok) {
          const data = await contextResponse.json();
          setContext(data);
        } else {
          setContext({
            state: "none",
            canAccessApp: false,
            canPublish: false,
            trialEndsAt: null,
          });
        }
        if (statusResponse.ok) setStatusData(await statusResponse.json());
      } catch (error) {
        console.error("Error loading subscription context:", error);
        setContext({
          state: "none",
          canAccessApp: false,
          canPublish: false,
          trialEndsAt: null,
        });
      } finally {
        setLoading(false);
      }
    }
    loadContext();
  }, []);

  useEffect(() => {
    if (!context || context.state === "none") return;
    let cancelled = false;
    setAnalyticsLoading(true);
    const params = new URLSearchParams();
    params.set("range", range);
    if (range === "custom" && customStart && customEnd) {
      params.set("start", customStart);
      params.set("end", customEnd);
    }
    fetch(`/api/app/dashboard/analytics?${params.toString()}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setAnalytics(data);
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [context, range, customStart, customEnd]);

  useEffect(() => {
    if (!loading && context && context.state === "none") router.push("/app/select-plan");
  }, [loading, context, router]);

  const isTrial = context?.state === "trial";
  const trialDays = statusData?.trialEndDate ? daysRemaining(statusData.trialEndDate) : null;
  const showTrialWarning = isTrial && trialDays !== null && trialDays < 5;

  if (loading || !context) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner message="Dashboard wird geladen..." />
      </div>
    );
  }
  if (context.state === "none") return null;

  const k = analytics?.kpis;
  const prev = k?.previousPeriod;

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <header style={{ marginBottom: SECTION_GAP }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#0f172a",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 4 }}>
          Willkommen zurück, {session?.user?.name || session?.user?.email}
        </p>
        {statusData?.subscription && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: showTrialWarning ? "#b45309" : "#64748b",
              margin: 0,
              marginTop: 4,
            }}
          >
            {isTrial && trialDays !== null ? (
              <>
                Testphase · {trialDays} {trialDays === 1 ? "Tag" : "Tage"} verbleibend
                {" · "}
                <Link
                  href="/app/organization/billing"
                  style={{ color: "#0f172a", fontWeight: "500", textDecoration: "none" }}
                >
                  Upgrade →
                </Link>
              </>
            ) : (
              <>
                {statusData.subscription.pricingPlan?.name ?? "Abo"}
                {" · "}
                <Link
                  href="/app/organization/billing"
                  style={{ color: "#0f172a", fontWeight: "500", textDecoration: "none" }}
                >
                  Abo verwalten →
                </Link>
              </>
            )}
          </p>
        )}
      </header>

      <div style={{ marginBottom: SUBSECTION_GAP }}>
        <TimeFilter basePath="/app/dashboard" />
      </div>

      <section
        style={{
          marginBottom: activeKpi ? CHART_TO_ACTIONS_GAP : SECTION_GAP,
        }}
      >
        {analyticsLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: SUBSECTION_GAP,
            }}
            className="dashboard-kpi-grid"
          >
            {[1, 2, 3, 4].map((i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
        ) : k ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: SUBSECTION_GAP,
              }}
              className="dashboard-kpi-grid"
            >
              <DashboardKpiCard
                id="created"
                label="Erstellte DPP"
                value={k.createdDpp}
                previousValue={prev?.createdDpp}
                trend={k.trend.createdDpp}
                active={activeKpi === "created"}
                expandable
                onSelect={() =>
                  setActiveKpi((a) => (a === "created" ? null : "created"))
                }
              />
              <DashboardKpiCard
                id="published"
                label="Veröffentlicht"
                value={k.publishedDpp}
                previousValue={prev?.publishedDpp}
                trend={k.trend.publishedDpp}
                active={activeKpi === "published"}
                expandable
                onSelect={() =>
                  setActiveKpi((a) => (a === "published" ? null : "published"))
                }
              />
              <DashboardKpiCard
                id="scans"
                label="Scans"
                value={k.scansInPeriod}
                previousValue={prev?.scansInPeriod}
                trend={k.trend.scansInPeriod}
                active={activeKpi === "scans"}
                expandable
                onSelect={() =>
                  setActiveKpi((a) => (a === "scans" ? null : "scans"))
                }
              />
              <DashboardKpiCard
                id="avgScans"
                label="Ø Scans pro veröff. DPP"
                value={k.avgScansPerPublishedDpp}
                previousValue={prev?.scansInPeriod}
                trend={k.trend.avgScansPerPublishedDpp}
                active={activeKpi === "avgScans"}
                expandable
                onSelect={() =>
                  setActiveKpi((a) => (a === "avgScans" ? null : "avgScans"))
                }
              />
            </div>
            <div
              style={{
                overflow: "hidden",
                transition: "max-height 250ms ease",
                maxHeight: activeKpi ? 420 : 0,
                marginTop: activeKpi ? SUBSECTION_GAP : 0,
              }}
            >
              {activeKpi && (
                <KpiChart
                  kpiId={activeKpi}
                  timeSeries={analytics?.timeSeries ?? null}
                  label={
                    activeKpi === "created"
                      ? "Erstellte DPP"
                      : activeKpi === "published"
                        ? "Veröffentlicht"
                        : activeKpi === "scans"
                          ? "Scans"
                          : "Ø Scans pro veröff. DPP"
                  }
                />
              )}
            </div>
          </>
        ) : null}
      </section>

      <section style={{ marginTop: 0 }}>
        <DashboardGrid>
          <DashboardCard
            href="/app/create"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#24c598" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
            title="Produktpass erstellen"
            description="Neuen Digitalen Produktpass anlegen."
          />
          <DashboardCard
            href="/app/dpps"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#24c598" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            }
            title="Produktpässe verwalten"
            description="Alle DPPs an einem Ort."
          />
          {(userRole === "ORG_ADMIN" || userRole === "ORG_OWNER") && (
            <DashboardCard
              href="/app/organization"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#24c598" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              }
              title="Organisation"
              description="Team und Einstellungen."
            />
          )}
          <DashboardCard
            href="/app/account"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#24c598" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            title="Meine Daten"
            description="Konto und Einstellungen."
          />
          {availableFeatures.includes("audit_logs") && (
            <DashboardCard
              href="/app/audit-logs"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#24c598" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              title="Audit Logs"
              description="Compliance-relevante Aktionen."
            />
          )}
        </DashboardGrid>
      </section>

      <style jsx>{`
        @media (max-width: 768px) {
          .dashboard-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
