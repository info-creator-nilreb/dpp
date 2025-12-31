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
            subscription: {
              include: {
                subscriptionModel: {
                  include: {
                    pricingPlan: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
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

    // Get plan name from subscriptionModel.pricingPlan.name (not from deprecated subscription.plan)
    const planName = subscription?.subscriptionModel?.pricingPlan?.name || subscription?.plan || null;
    const planSlug = subscription?.subscriptionModel?.pricingPlan?.slug || null;

    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            plan: planSlug || planName?.toLowerCase() || subscription.plan, // Use slug or lowercase name, fallback to legacy plan
            planName: planName, // Full plan name for display
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

