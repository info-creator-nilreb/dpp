import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCapabilitiesForOrganization, getTrialDaysRemaining } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization (get first membership for now)
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id as string },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const subscription = membership.organization.subscription;
    const capabilities = await getCapabilitiesForOrganization(
      membership.organizationId
    );

    const trialDaysRemaining = subscription
      ? getTrialDaysRemaining(subscription as any)
      : null;

    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            trialExpiresAt: subscription.trialExpiresAt,
            trialStartedAt: subscription.trialStartedAt,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
          }
        : null,
      capabilities,
      trialDaysRemaining,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

