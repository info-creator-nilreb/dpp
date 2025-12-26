import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCapabilitiesForOrganization, getTrialDaysRemaining } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get DPP and organization
    const dpp = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: { organization: true },
    });

    if (!dpp) {
      return NextResponse.json({ error: "DPP not found" }, { status: 404 });
    }

    // Check organization membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id as string,
        organizationId: dpp.organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: dpp.organizationId },
    });

    // Get capabilities
    const capabilities = await getCapabilitiesForOrganization(dpp.organizationId);

    // Calculate trial days remaining
    const trialDaysRemaining = subscription
      ? getTrialDaysRemaining(subscription as any)
      : null;

    return NextResponse.json({
      capabilities,
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            trialExpiresAt: subscription.trialExpiresAt,
            trialStartedAt: subscription.trialStartedAt,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      trialDaysRemaining,
    });
  } catch (error) {
    console.error("Error fetching capabilities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

