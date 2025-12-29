/**
 * Compare Dev and Prod Databases
 * 
 * Lists all tables in both databases and identifies differences
 */

import { PrismaClient } from "@prisma/client"

async function listTables(prisma: PrismaClient): Promise<string[]> {
  // PostgreSQL query to list all tables
  const result = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `
  return result.map(r => r.tablename)
}

async function main() {
  // Load environment variables
  const devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL
  const prodUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL

  if (!devUrl || !prodUrl) {
    console.error("❌ DATABASE_URL oder DEV_DATABASE_URL/PROD_DATABASE_URL müssen gesetzt sein")
    process.exit(1)
  }

  console.log("📊 Vergleiche Datenbanken...\n")

  // Connect to Dev
  const devPrisma = new PrismaClient({
    datasources: {
      db: {
        url: devUrl
      }
    }
  })

  // Connect to Prod
  const prodPrisma = new PrismaClient({
    datasources: {
      db: {
        url: prodUrl
      }
    }
  })

  try {
    const devTables = await listTables(devPrisma)
    const prodTables = await listTables(prodPrisma)

    console.log(`🔵 Dev Datenbank: ${devTables.length} Tabellen`)
    console.log(`🟢 Prod Datenbank: ${prodTables.length} Tabellen\n`)

    const missingInProd = devTables.filter(t => !prodTables.includes(t))
    const missingInDev = prodTables.filter(t => !devTables.includes(t))

    if (missingInProd.length > 0) {
      console.log("❌ Fehlende Tabellen in Production:")
      missingInProd.forEach(table => console.log(`   - ${table}`))
      console.log("")
    }

    if (missingInDev.length > 0) {
      console.log("⚠️  Tabellen in Production, die nicht in Dev sind:")
      missingInDev.forEach(table => console.log(`   - ${table}`))
      console.log("")
    }

    if (missingInProd.length === 0 && missingInDev.length === 0) {
      console.log("✅ Beide Datenbanken haben die gleichen Tabellen!")
    }

    // Show all tables
    console.log("\n📋 Alle Tabellen in Dev:")
    devTables.forEach((table, i) => console.log(`   ${i + 1}. ${table}`))

  } catch (error) {
    console.error("❌ Fehler:", error)
    process.exit(1)
  } finally {
    await devPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

main()


