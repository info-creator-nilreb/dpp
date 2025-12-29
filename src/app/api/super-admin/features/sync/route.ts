/**
 * FEATURE SYNC API
 * 
 * Endpoint to sync features from manifest to database
 * Only accessible by Super Admins
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { syncFeaturesFromManifest, validateFeatureRegistry } from "@/features/sync-features"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getSuperAdminSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Sync features from manifest
    const syncResults = await syncFeaturesFromManifest()

    // Validate registry
    const validation = await validateFeatureRegistry()

    return NextResponse.json({
      success: true,
      sync: syncResults,
      validation,
    })
  } catch (error: any) {
    console.error("Error syncing features:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync features" },
      { status: 500 }
    )
  }
}

