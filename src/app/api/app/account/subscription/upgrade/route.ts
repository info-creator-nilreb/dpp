import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !["basic", "pro", "premium"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be basic, pro, or premium" },
        { status: 400 }
      );
    }

    // Get user's organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id as string },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // Get subscription separately
    let subscription = await prisma.subscription.findUnique({
      where: { organizationId: membership.organizationId },
    });

    // If no subscription exists, create one (shouldn't happen, but handle it)
    // Phase 1.9: This should not create trial without planId - use expired instead
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          organizationId: membership.organizationId,
          plan: "premium",
          status: "expired", // Phase 1.9: Don't create trial without planId
          // No trial dates - organization is on Free tier
        } as any, // Type assertion needed until Prisma Client is regenerated
      });
    }

    // Upgrade from trial
    if (subscription.status === "trial_active") {
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30); // 30 days
      
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          plan,
          trialExpiresAt: null, // Clear trial expiration
          currentPeriodStart: new Date(),
          currentPeriodEnd: currentPeriodEnd,
        } as any, // Type assertion needed until Prisma Client is regenerated
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
        },
        message: "Successfully upgraded from trial",
      });
    }

    // Normal upgrade (would need Stripe integration in production)
    // For now, just update the plan
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
      },
      message: "Plan updated successfully",
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

