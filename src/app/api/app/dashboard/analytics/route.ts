export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getDashboardKpis,
  getRecentActivity,
  getOpenDraftsCount,
  getTopDppsInTimeframe,
  getDppsMissingRequiredFieldsCount,
  getKpiTimeSeries,
  getDateRange,
  getPreviousPeriod,
  type TimeRange,
} from "@/lib/dashboard/dashboardAnalyticsService";

/**
 * GET /api/app/dashboard/analytics
 *
 * Returns KPIs, recent activity, open drafts, missing fields count, and top DPPs
 * for the current user's organization. Respects timeframe (range, start, end).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    });

    if (!membership?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation gefunden" },
        { status: 404 }
      );
    }

    const organizationId = membership.organizationId;
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") || "30days") as TimeRange;
    const customStart = searchParams.get("start") || undefined;
    const customEnd = searchParams.get("end") || undefined;

    const { startDate, endDate } = getDateRange(range, customStart, customEnd);
    const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriod(
      range,
      customStart,
      customEnd
    );

    const [kpis, recentActivity, openDrafts, missingRequired, topDpps, timeSeries] =
      await Promise.all([
        getDashboardKpis(organizationId, range, customStart, customEnd),
        getRecentActivity(organizationId, 10),
        getOpenDraftsCount(organizationId),
        getDppsMissingRequiredFieldsCount(organizationId),
        getTopDppsInTimeframe(organizationId, startDate, endDate, 5),
        getKpiTimeSeries(organizationId, startDate, endDate, prevStart, prevEnd),
      ]);

    return NextResponse.json({
      kpis,
      recentActivity,
      openDrafts,
      dppsMissingRequiredFields: missingRequired,
      topDpps,
      timeSeries,
    });
  } catch (e: unknown) {
    console.error("[Dashboard Analytics]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler beim Laden der Analytics" },
      { status: 500 }
    );
  }
}
