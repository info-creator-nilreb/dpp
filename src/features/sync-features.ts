/**
 * FEATURE SYNC
 * 
 * Automatic synchronization of Feature Manifest to database
 * 
 * This script:
 * - Reads FEATURE_MANIFEST
 * - Inserts missing features into the database
 * - Marks them as system_defined = true
 * - Never allows manual feature creation
 * - Never allows editing of feature keys
 * - Is safe to run multiple times (idempotent)
 */

import { prisma } from "@/lib/prisma"
import { FEATURE_MANIFEST, getAllFeatureDefinitions } from "./feature-manifest"

/**
 * Sync features from manifest to database
 * 
 * This function is idempotent and safe to run multiple times.
 * It will:
 * - Create missing features
 * - Update existing system-defined features (except key)
 * - Leave manually created features (systemDefined=false) untouched
 */
export async function syncFeaturesFromManifest(): Promise<{
  created: number
  updated: number
  skipped: number
  errors: string[]
}> {
  const manifestFeatures = getAllFeatureDefinitions()
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  }

  for (const manifestFeature of manifestFeatures) {
    try {
      const existing = await prisma.featureRegistry.findUnique({
        where: { key: manifestFeature.key },
      })

      if (existing) {
        // Feature exists - update if system-defined
        if (existing.systemDefined) {
          // Update system-defined feature (key is immutable)
          await prisma.featureRegistry.update({
            where: { key: manifestFeature.key },
            data: {
              name: manifestFeature.defaultName,
              description: manifestFeature.defaultDescription,
              category: manifestFeature.category,
              minimumPlan: manifestFeature.minimumPlan || "basic",
              requiresActiveSubscription:
                manifestFeature.requiresActiveSubscription ?? true,
              requiresPublishingCapability:
                manifestFeature.requiresPublishingCapability ?? false,
              visibleInTrial: manifestFeature.visibleInTrial ?? true,
              usableInTrial: manifestFeature.usableInTrial ?? true,
              systemDefined: true,
              // enabled remains as-is (can be toggled in admin UI)
            },
          })
          results.updated++
        } else {
          // Manually created feature - skip (don't overwrite)
          results.skipped++
        }
      } else {
        // Feature doesn't exist - create it
        await prisma.featureRegistry.create({
          data: {
            key: manifestFeature.key,
            name: manifestFeature.defaultName,
            description: manifestFeature.defaultDescription,
            category: manifestFeature.category,
            minimumPlan: manifestFeature.minimumPlan || "basic",
            requiresActiveSubscription:
              manifestFeature.requiresActiveSubscription ?? true,
            requiresPublishingCapability:
              manifestFeature.requiresPublishingCapability ?? false,
            visibleInTrial: manifestFeature.visibleInTrial ?? true,
            usableInTrial: manifestFeature.usableInTrial ?? true,
            enabled: true, // Default enabled
            systemDefined: true,
          },
        })
        results.created++
      }
    } catch (error: any) {
      results.errors.push(
        `Error syncing feature ${manifestFeature.key}: ${error.message}`
      )
    }
  }

  return results
}

/**
 * Validate that all features in database are either:
 * - Defined in manifest (systemDefined=true)
 * - Or manually created (systemDefined=false)
 */
export async function validateFeatureRegistry(): Promise<{
  valid: boolean
  issues: string[]
}> {
  const issues: string[] = []
  const manifestKeys = Object.keys(FEATURE_MANIFEST)

  const allFeatures = await prisma.featureRegistry.findMany({
    select: {
      key: true,
      systemDefined: true,
    },
  })

  for (const feature of allFeatures) {
    if (feature.systemDefined && !manifestKeys.includes(feature.key)) {
      issues.push(
        `Feature ${feature.key} is marked as system-defined but not in manifest`
      )
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

