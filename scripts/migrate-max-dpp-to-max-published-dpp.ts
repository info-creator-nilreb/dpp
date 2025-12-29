/**
 * Migration Script: max_dpp → max_published_dpp
 * 
 * Migrates existing entitlement keys from max_dpp to max_published_dpp
 * Updates:
 * - Entitlement table: Creates new max_published_dpp entry
 * - PricingPlanEntitlement: Updates entitlementKey references
 * - EntitlementSnapshot: Updates key references
 * 
 * Run with: npx tsx scripts/migrate-max-dpp-to-max-published-dpp.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting migration: max_dpp → max_published_dpp")

  // 1. Create new entitlement if it doesn't exist
  const existingNew = await prisma.entitlement.findUnique({
    where: { key: "max_published_dpp" }
  })

  if (!existingNew) {
    // Check if old one exists to copy its properties
    const oldEntitlement = await prisma.entitlement.findUnique({
      where: { key: "max_dpp" }
    })

    if (oldEntitlement) {
      await prisma.entitlement.create({
        data: {
          key: "max_published_dpp",
          type: oldEntitlement.type,
          unit: oldEntitlement.unit
        }
      })
      console.log("✓ Created new entitlement: max_published_dpp")
    } else {
      // Create default
      await prisma.entitlement.create({
        data: {
          key: "max_published_dpp",
          type: "limit",
          unit: "count"
        }
      })
      console.log("✓ Created new entitlement: max_published_dpp (default)")
    }
  } else {
    console.log("✓ Entitlement max_published_dpp already exists")
  }

  // 2. Migrate PricingPlanEntitlement entries
  const planEntitlements = await prisma.pricingPlanEntitlement.findMany({
    where: { entitlementKey: "max_dpp" }
  })

  if (planEntitlements.length > 0) {
    console.log(`Found ${planEntitlements.length} PricingPlanEntitlement entries to migrate`)
    
    for (const entry of planEntitlements) {
      // Check if new entry already exists
      const existing = await prisma.pricingPlanEntitlement.findUnique({
        where: {
          pricingPlanId_entitlementKey: {
            pricingPlanId: entry.pricingPlanId,
            entitlementKey: "max_published_dpp"
          }
        }
      })

      if (!existing) {
        await prisma.pricingPlanEntitlement.create({
          data: {
            pricingPlanId: entry.pricingPlanId,
            entitlementKey: "max_published_dpp",
            value: entry.value
          }
        })
        console.log(`  ✓ Migrated plan entitlement for plan ${entry.pricingPlanId}`)
      } else {
        console.log(`  - Plan entitlement for plan ${entry.pricingPlanId} already exists`)
      }
    }
  } else {
    console.log("✓ No PricingPlanEntitlement entries to migrate")
  }

  // 3. Migrate EntitlementSnapshot entries
  const snapshots = await prisma.entitlementSnapshot.findMany({
    where: { key: "max_dpp" }
  })

  if (snapshots.length > 0) {
    console.log(`Found ${snapshots.length} EntitlementSnapshot entries to migrate`)
    
    for (const snapshot of snapshots) {
      // Check if new snapshot already exists
      const existing = await prisma.entitlementSnapshot.findUnique({
        where: {
          subscriptionId_key: {
            subscriptionId: snapshot.subscriptionId,
            key: "max_published_dpp"
          }
        }
      })

      if (!existing) {
        await prisma.entitlementSnapshot.create({
          data: {
            subscriptionId: snapshot.subscriptionId,
            key: "max_published_dpp",
            value: snapshot.value
          }
        })
        console.log(`  ✓ Migrated snapshot for subscription ${snapshot.subscriptionId}`)
      } else {
        console.log(`  - Snapshot for subscription ${snapshot.subscriptionId} already exists`)
      }
    }
  } else {
    console.log("✓ No EntitlementSnapshot entries to migrate")
  }

  console.log("\n✓ Migration completed successfully!")
  console.log("\nNote: Old max_dpp entries are kept for reference but should not be used for new subscriptions.")
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

