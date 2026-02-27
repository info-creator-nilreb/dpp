/**
 * Dashboard Analytics Service
 *
 * Server-side analytics for the user dashboard.
 * All data scoped to organizationId (multi-tenant).
 * Scans aus dpp_scans (öffentliche DPP-Aufrufe).
 */

import { prisma } from "@/lib/prisma";

export type TimeRange = "today" | "30days" | "1year" | "custom";

export function getDateRange(
  range: TimeRange,
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  let startDate = new Date();

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "30days":
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "1year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (customStart && customEnd) {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
        endDate.setTime(new Date(customEnd).getTime());
        endDate.setHours(23, 59, 59, 999);
      }
      break;
  }
  return { startDate, endDate };
}

/** Previous period of same length for comparison */
export function getPreviousPeriod(
  range: TimeRange,
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date } {
  const { startDate: periodEnd, endDate } = getDateRange(range, customStart, customEnd);
  const ms = endDate.getTime() - periodEnd.getTime();
  const prevEnd = new Date(periodEnd.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - ms);
  return { startDate: prevStart, endDate: prevEnd };
}

export interface DashboardKpis {
  createdDpp: number;
  publishedDpp: number;
  totalScans: number;
  scansInPeriod: number;
  avgScansPerPublishedDpp: number;
  previousPeriod: {
    createdDpp: number;
    publishedDpp: number;
    scansInPeriod: number;
  };
  trend: {
    createdDpp: { value: number; isPositive: boolean };
    publishedDpp: { value: number; isPositive: boolean };
    scansInPeriod: { value: number; isPositive: boolean };
    avgScansPerPublishedDpp: { value: number; isPositive: boolean };
  };
}

function percentChange(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(pct), isPositive: pct >= 0 };
}

export async function getDashboardKpis(
  organizationId: string,
  range: TimeRange,
  customStart?: string,
  customEnd?: string
): Promise<DashboardKpis> {
  const { startDate, endDate } = getDateRange(range, customStart, customEnd);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriod(range, customStart, customEnd);

  const orgFilter = { organizationId };

  const [
    createdDpp,
    publishedDpp,
    prevCreatedDpp,
    prevPublishedDpp,
    totalPublishedCount,
    totalScans,
    scansInPeriod,
    prevScansInPeriod,
  ] = await Promise.all([
    prisma.dpp.count({
      where: {
        ...orgFilter,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.dpp.count({
      where: {
        ...orgFilter,
        status: "PUBLISHED",
        updatedAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.dpp.count({
      where: {
        ...orgFilter,
        createdAt: { gte: prevStart, lte: prevEnd },
      },
    }),
    prisma.dpp.count({
      where: {
        ...orgFilter,
        status: "PUBLISHED",
        updatedAt: { gte: prevStart, lte: prevEnd },
      },
    }),
    prisma.dpp.count({
      where: { ...orgFilter, status: "PUBLISHED" },
    }),
    typeof prisma.dppScan?.count === "function"
      ? prisma.dppScan.count({
          where: { dpp: { organizationId } },
        })
      : 0,
    typeof prisma.dppScan?.count === "function"
      ? prisma.dppScan.count({
          where: {
            dpp: { organizationId },
            scannedAt: { gte: startDate, lte: endDate },
          },
        })
      : 0,
    typeof prisma.dppScan?.count === "function"
      ? prisma.dppScan.count({
          where: {
            dpp: { organizationId },
            scannedAt: { gte: prevStart, lte: prevEnd },
          },
        })
      : 0,
  ]);
  const avgScansPerPublishedDpp = totalPublishedCount > 0 ? totalScans / totalPublishedCount : 0;
  const prevAvg = totalPublishedCount > 0 ? prevScansInPeriod / totalPublishedCount : 0;

  return {
    createdDpp,
    publishedDpp,
    totalScans,
    scansInPeriod,
    avgScansPerPublishedDpp: Math.round(avgScansPerPublishedDpp * 10) / 10,
    previousPeriod: {
      createdDpp: prevCreatedDpp,
      publishedDpp: prevPublishedDpp,
      scansInPeriod: prevScansInPeriod,
    },
    trend: {
      createdDpp: percentChange(createdDpp, prevCreatedDpp),
      publishedDpp: percentChange(publishedDpp, prevPublishedDpp),
      scansInPeriod: percentChange(scansInPeriod, prevScansInPeriod),
      avgScansPerPublishedDpp: percentChange(avgScansPerPublishedDpp, prevAvg),
    },
  };
}

export interface RecentActivityItem {
  id: string;
  date: string;
  actionType: string;
  entityType: string;
  entityId: string;
  dppName: string | null;
}

export async function getRecentActivity(
  organizationId: string,
  limit: number = 10
): Promise<RecentActivityItem[]> {
  const logs = await prisma.platformAuditLog.findMany({
    where: {
      organizationId,
      entityType: "DPP",
      actionType: { in: ["CREATE", "PUBLISH", "UPDATE"] },
    },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      actionType: true,
      entityType: true,
      entityId: true,
    },
  });

  const dppIds = [...new Set(logs.map((l) => l.entityId).filter((id): id is string => id != null))];
  const dpps =
    dppIds.length > 0
      ? await prisma.dpp.findMany({
          where: { id: { in: dppIds }, organizationId },
          select: { id: true, name: true },
        })
      : [];
  const nameById = Object.fromEntries(dpps.map((d) => [d.id, d.name]));

  return logs.map((log) => ({
    id: log.id,
    date: log.timestamp.toISOString(),
    actionType: log.actionType,
    entityType: log.entityType,
    entityId: log.entityId || "",
    dppName: (log.entityId && nameById[log.entityId]) || null,
  }));
}

export async function getOpenDraftsCount(organizationId: string): Promise<number> {
  return prisma.dpp.count({
    where: {
      organizationId,
      status: "DRAFT",
    },
  });
}

export interface TopDppItem {
  dppId: string;
  dppName: string;
  totalScans: number;
  percentageShare: number;
}

export async function getTopDppsInTimeframe(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 5
): Promise<TopDppItem[]> {
  // No scan table: use published DPPs with most recent activity in period as proxy
  const published = await prisma.dpp.findMany({
    where: {
      organizationId,
      status: "PUBLISHED",
      updatedAt: { gte: startDate, lte: endDate },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, name: true },
  });

  const total = published.length;
  return published.map((d, i) => ({
    dppId: d.id,
    dppName: d.name,
    totalScans: 0,
    percentageShare: total > 0 ? Math.round((1 / total) * 100) : 0,
  }));
}

export async function getDppsMissingRequiredFieldsCount(_organizationId: string): Promise<number> {
  // No validation API yet – return 0
  return 0;
}

/** Daily time-series for chart: dates and counts per metric */
export interface KpiTimeSeries {
  dates: string[];
  current: { created: number[]; published: number[]; scans: number[] };
  previous: { created: number[]; published: number[]; scans: number[] };
}

function getDatesBetween(start: Date, end: Date): string[] {
  const out: string[] = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const endTime = end.getTime();
  while (d.getTime() <= endTime) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export async function getKpiTimeSeries(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date
): Promise<KpiTimeSeries> {
  const dates = getDatesBetween(startDate, endDate);
  const prevDates = getDatesBetween(prevStart, prevEnd);

  const createdMap = new Map<string, number>();
  const publishedMap = new Map<string, number>();
  const scansMap = new Map<string, number>();
  dates.forEach((d) => createdMap.set(d, 0));
  dates.forEach((d) => publishedMap.set(d, 0));
  dates.forEach((d) => scansMap.set(d, 0));
  const prevCreatedMap = new Map<string, number>();
  const prevPublishedMap = new Map<string, number>();
  const prevScansMap = new Map<string, number>();
  prevDates.forEach((d) => prevCreatedMap.set(d, 0));
  prevDates.forEach((d) => prevPublishedMap.set(d, 0));
  prevDates.forEach((d) => prevScansMap.set(d, 0));

  type Row = { d: string; c: number };
  const created = await prisma.$queryRaw<Row[]>`
    SELECT (date_trunc('day', "createdAt"::timestamptz)::date)::text as d, COUNT(*)::int as c
    FROM dpps
    WHERE "organizationId" = ${organizationId}
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY date_trunc('day', "createdAt"::timestamptz)::date
    ORDER BY 1
  `;
  created.forEach((r) => createdMap.set(r.d, r.c));

  const published = await prisma.$queryRaw<Row[]>`
    SELECT (date_trunc('day', "updatedAt"::timestamptz)::date)::text as d, COUNT(*)::int as c
    FROM dpps
    WHERE "organizationId" = ${organizationId}
      AND status = 'PUBLISHED'
      AND "updatedAt" >= ${startDate}
      AND "updatedAt" <= ${endDate}
    GROUP BY date_trunc('day', "updatedAt"::timestamptz)::date
    ORDER BY 1
  `;
  published.forEach((r) => publishedMap.set(r.d, r.c));

  const prevCreated = await prisma.$queryRaw<Row[]>`
    SELECT (date_trunc('day', "createdAt"::timestamptz)::date)::text as d, COUNT(*)::int as c
    FROM dpps
    WHERE "organizationId" = ${organizationId}
      AND "createdAt" >= ${prevStart}
      AND "createdAt" <= ${prevEnd}
    GROUP BY date_trunc('day', "createdAt"::timestamptz)::date
    ORDER BY 1
  `;
  prevCreated.forEach((r) => prevCreatedMap.set(r.d, r.c));

  const prevPublished = await prisma.$queryRaw<Row[]>`
    SELECT (date_trunc('day', "updatedAt"::timestamptz)::date)::text as d, COUNT(*)::int as c
    FROM dpps
    WHERE "organizationId" = ${organizationId}
      AND status = 'PUBLISHED'
      AND "updatedAt" >= ${prevStart}
      AND "updatedAt" <= ${prevEnd}
    GROUP BY date_trunc('day', "updatedAt"::timestamptz)::date
    ORDER BY 1
  `;
  prevPublished.forEach((r) => prevPublishedMap.set(r.d, r.c));

  if (typeof prisma.dppScan?.count === "function") {
    try {
      const scanRows = await prisma.$queryRaw<Row[]>`
        SELECT (date_trunc('day', s."scannedAt"::timestamptz)::date)::text as d, COUNT(*)::int as c
        FROM dpp_scans s
        INNER JOIN dpps p ON p.id = s."dppId"
        WHERE p."organizationId" = ${organizationId}
          AND s."scannedAt" >= ${startDate}
          AND s."scannedAt" <= ${endDate}
        GROUP BY date_trunc('day', s."scannedAt"::timestamptz)::date
        ORDER BY 1
      `;
      scanRows.forEach((r) => scansMap.set(r.d, r.c));
      const prevScanRows = await prisma.$queryRaw<Row[]>`
        SELECT (date_trunc('day', s."scannedAt"::timestamptz)::date)::text as d, COUNT(*)::int as c
        FROM dpp_scans s
        INNER JOIN dpps p ON p.id = s."dppId"
        WHERE p."organizationId" = ${organizationId}
          AND s."scannedAt" >= ${prevStart}
          AND s."scannedAt" <= ${prevEnd}
        GROUP BY date_trunc('day', s."scannedAt"::timestamptz)::date
        ORDER BY 1
      `;
      prevScanRows.forEach((r) => prevScansMap.set(r.d, r.c));
    } catch {
      // dpp_scans Tabelle fehlt oder Fehler – Zeitreihen bleiben 0
    }
  }

  return {
    dates,
    current: {
      created: dates.map((d) => createdMap.get(d) ?? 0),
      published: dates.map((d) => publishedMap.get(d) ?? 0),
      scans: dates.map((d) => scansMap.get(d) ?? 0),
    },
    previous: {
      created: prevDates.map((d) => prevCreatedMap.get(d) ?? 0),
      published: prevDates.map((d) => prevPublishedMap.get(d) ?? 0),
      scans: prevDates.map((d) => prevScansMap.get(d) ?? 0),
    },
  };
}
