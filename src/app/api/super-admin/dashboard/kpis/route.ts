import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionAndRoleApi } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

/**
 * KPI API Endpoint
 * 
 * Returns KPIs for the Systemüberblick section
 * Supports time range filtering via query parameters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSessionAndRoleApi("super_admin");

    if (session instanceof NextResponse) {
      return session;
    }

    // Parse time range from URL
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30days";
    const customStart = searchParams.get("start");
    const customEnd = searchParams.get("end");

    // Calculate date range
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

    // KPI 1: Organisationen (total count, optionally filtered by creation date)
    // For "today" and custom ranges, filter by creation date
    // For longer ranges, show total count
    const orgWhere: any = {};
    if (range === "today" || range === "custom") {
      orgWhere.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }
    const orgCount = await prisma.organization.count({
      where: orgWhere,
    });

    // KPI 2: Aktive Nutzer (users with activity in period)
    // Note: We use createdAt as proxy for activity since User model doesn't have lastLoginAt
    // In a production system, you'd track login/activity events separately
    const activeUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // KPI 3: Aktive DPPs (DPPs that exist and are not archived)
    // For time-based filtering, we use updatedAt as proxy for activity
    const activeDpps = await prisma.dpp.count({
      where: {
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // KPI 4: DPP-Scans
    // Note: If scan tracking doesn't exist yet, return 0
    // In a real system, you'd have a DppScan or ScanEvent table
    const dppScans = 0; // Placeholder - implement when scan tracking is available

    // KPI 5: Subscriptions nach Typ (current state, not time-series)
    const subscriptions = await prisma.subscription.groupBy({
      by: ["plan", "status"],
      _count: {
        id: true,
      },
    });

    // Aggregate subscription counts by plan
    const subscriptionBreakdown = {
      trial: 0,
      basic: 0,
      pro: 0,
      premium: 0,
    };

    subscriptions.forEach((sub) => {
      // Only count active subscriptions
      if (sub.status === "trial_active" || sub.status === "active") {
        if (sub.plan === "basic") {
          subscriptionBreakdown.basic += sub._count.id;
        } else if (sub.plan === "pro") {
          subscriptionBreakdown.pro += sub._count.id;
        } else if (sub.plan === "premium") {
          subscriptionBreakdown.premium += sub._count.id;
        }
        // Count trial_active as trial
        if (sub.status === "trial_active") {
          subscriptionBreakdown.trial += sub._count.id;
        }
      }
    });

    return NextResponse.json({
      organizations: orgCount,
      activeUsers,
      activeDpps,
      dppScans,
      subscriptions: subscriptionBreakdown,
    });
  } catch (error: any) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

