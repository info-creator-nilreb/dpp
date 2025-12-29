/**
 * Compare tables between Dev and Prod databases
 * and prepare schema synchronization
 */

import { PrismaClient } from "@prisma/client"

const DEV_DB_ID = "jhxdwgnvmbnxjwiaodtj"
const PROD_DB_ID = "fnfuklgbsojzdfnmrfad"

// Construct database URLs (assuming Supabase format)
// You'll need to replace with actual credentials
const getDatabaseUrl = (dbId: string) => {
  // Extract from current DATABASE_URL if it exists
  const currentUrl = process.env.DATABASE_URL || ""
  if (currentUrl.includes(DEV_DB_ID)) {
    return currentUrl.replace(DEV_DB_ID, dbId)
  }
  // Fallback: construct from pattern
  return `postgresql://postgres.${dbId}:PASSWORD@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require`
}

async function listTables(prisma: PrismaClient): Promise<string[]> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `
  return tables.map(t => t.tablename).filter(t => t !== '_prisma_migrations')
}

async function compareDatabases() {
  console.log("🔍 Vergleich der Datenbanken...\n")

  // Connect to Dev database
  const devUrl = getDatabaseUrl(DEV_DB_ID)
  const devPrisma = new PrismaClient({
    datasources: { db: { url: devUrl } }
  })

  // Connect to Prod database
  const prodUrl = getDatabaseUrl(PROD_DB_ID)
  const prodPrisma = new PrismaClient({
    datasources: { db: { url: prodUrl } }
  })

  try {
    // List tables in both databases
    console.log("📊 Lade Tabellen aus Dev-Datenbank...")
    const devTables = await listTables(devPrisma)
    console.log(`✅ Dev: ${devTables.length} Tabellen gefunden\n`)

    console.log("📊 Lade Tabellen aus Prod-Datenbank...")
    const prodTables = await listTables(prodPrisma)
    console.log(`✅ Prod: ${prodTables.length} Tabellen gefunden\n`)

    // Find missing tables
    const missingInProd = devTables.filter(t => !prodTables.includes(t))
    const extraInProd = prodTables.filter(t => !devTables.includes(t))

    console.log("📋 Vergleichsergebnis:\n")
    console.log(`Dev-Tabellen: ${devTables.length}`)
    console.log(`Prod-Tabellen: ${prodTables.length}`)
    console.log(`Fehlend in Prod: ${missingInProd.length}`)
    console.log(`Zusätzlich in Prod: ${extraInProd.length}\n`)

    if (missingInProd.length > 0) {
      console.log("❌ Fehlende Tabellen in Prod:")
      missingInProd.forEach((table, i) => {
        console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${table}`)
      })
      console.log()
    }

    if (extraInProd.length > 0) {
      console.log("⚠️  Zusätzliche Tabellen in Prod:")
      extraInProd.forEach((table, i) => {
        console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${table}`)
      })
      console.log()
    }

    if (missingInProd.length === 0 && extraInProd.length === 0) {
      console.log("✅ Beide Datenbanken haben die gleichen Tabellen!")
    } else {
      console.log("💡 Verwende 'prisma migrate deploy' um das Schema zu synchronisieren")
      console.log("   (nur Schema, keine Daten werden migriert)")
    }

  } catch (error: any) {
    console.error("❌ Fehler:", error.message)
    if (error.message.includes("PASSWORD")) {
      console.error("\n💡 Bitte DATABASE_URL in .env anpassen oder Credentials aktualisieren")
    }
    process.exit(1)
  } finally {
    await devPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

compareDatabases()

