import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionAndRoleApi } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await requireSessionAndRoleApi("super_admin");
    
    if (session instanceof NextResponse) {
      return session;
    }

    const feature = await prisma.featureRegistry.findUnique({
      where: { id },
      include: {
        blockTypes: true,
      },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    return NextResponse.json({ feature });
  } catch (error: any) {
    console.error("Error fetching feature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await requireSessionAndRoleApi("super_admin");
    
    if (session instanceof NextResponse) {
      return session;
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.capabilityKey !== undefined) updateData.capabilityKey = body.capabilityKey;
    if (body.minimumPlan !== undefined) updateData.minimumPlan = body.minimumPlan;
    if (body.requiresActiveSubscription !== undefined)
      updateData.requiresActiveSubscription = body.requiresActiveSubscription;
    if (body.requiresPublishingCapability !== undefined)
      updateData.requiresPublishingCapability = body.requiresPublishingCapability;
    if (body.visibleInTrial !== undefined) updateData.visibleInTrial = body.visibleInTrial;
    if (body.usableInTrial !== undefined) updateData.usableInTrial = body.usableInTrial;
    if (body.configSchema !== undefined)
      updateData.configSchema = body.configSchema
        ? JSON.stringify(body.configSchema)
        : null;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    if (body.defaultForNewDpps !== undefined)
      updateData.defaultForNewDpps = body.defaultForNewDpps;

    const feature = await prisma.featureRegistry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ feature });
  } catch (error: any) {
    console.error("Error updating feature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await requireSessionAndRoleApi("super_admin");
    
    if (session instanceof NextResponse) {
      return session;
    }

    await prisma.featureRegistry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting feature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

