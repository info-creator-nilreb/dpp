/**
 * Script to create initial entitlements
 * Run with: npx tsx scripts/create-initial-entitlements.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Creating initial entitlements...")

  const entitlements = [
    {
      key: "max_published_dpp",
      type: "limit",
      unit: "count"
    },
    {
      key: "max_dpp",
      type: "limit",
      unit: "count"
    },
    {
      key: "max_storage_gb",
      type: "limit",
      unit: "gb"
    },
    {
      key: "max_users",
      type: "limit",
      unit: "count"
    }
  ]

  for (const entitlement of entitlements) {
    try {
      const existing = await prisma.entitlement.findUnique({
        where: { key: entitlement.key }
      })

      if (existing) {
        console.log(`✓ Entitlement '${entitlement.key}' already exists`)
      } else {
        await prisma.entitlement.create({
          data: entitlement
        })
        console.log(`✓ Created entitlement '${entitlement.key}'`)
      }
    } catch (error) {
      console.error(`✗ Error creating entitlement '${entitlement.key}':`, error)
    }
  }

  console.log("\nDone!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

