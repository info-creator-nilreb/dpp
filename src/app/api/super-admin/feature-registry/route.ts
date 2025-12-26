import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionAndRoleApi } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Feature Registry: Only super_admin can access
    // Does NOT check subscription, trial, or any other state
    const session = await requireSessionAndRoleApi("super_admin");
    
    if (session instanceof NextResponse) {
      return session; // Already an error response
    }

    // DEBUG: Log session info (remove in production)
    console.log("[Feature Registry] Session resolved:", {
      email: session.email,
      role: session.role,
      type: session.type,
      id: session.id,
      expiresAt: session.expiresAt?.toISOString(),
    });

    const features = await prisma.featureRegistry.findMany({
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    console.log("Feature Registry: Found", features.length, "features");
    return NextResponse.json({ features });
  } catch (error: any) {
    console.error("Error fetching feature registry:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSessionAndRoleApi("super_admin");
    
    if (session instanceof NextResponse) {
      return session;
    }

    const body = await req.json();
    const {
      key,
      name,
      description,
      category,
      capabilityKey,
      minimumPlan,
      requiresActiveSubscription,
      requiresPublishingCapability,
      visibleInTrial,
      usableInTrial,
      configSchema,
      enabled,
      defaultForNewDpps,
    } = body;

    if (!key || !name || !category || !minimumPlan) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const feature = await prisma.featureRegistry.create({
      data: {
        key,
        name,
        description,
        category,
        capabilityKey,
        minimumPlan,
        requiresActiveSubscription: requiresActiveSubscription ?? true,
        requiresPublishingCapability: requiresPublishingCapability ?? false,
        visibleInTrial: visibleInTrial ?? true,
        usableInTrial: usableInTrial ?? true,
        configSchema: configSchema ? JSON.stringify(configSchema) : null,
        enabled: enabled ?? true,
        defaultForNewDpps: defaultForNewDpps ?? false,
      },
    });

    return NextResponse.json({ feature }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Feature key already exists" },
        { status: 400 }
      );
    }
    console.error("Error creating feature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

