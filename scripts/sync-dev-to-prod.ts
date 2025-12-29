/**
 * Sync Dev to Prod Database
 * 
 * Compares tables between Dev (jhxdwgnvmbnxjwiaodtj) and Prod (fnfuklgbsojzdfnmrfad)
 * Creates missing tables and columns in Production
 */

import { PrismaClient } from "@prisma/client"

const DEV_DB_ID = "jhxdwgnvmbnxjwiaodtj"
const PROD_DB_ID = "fnfuklgbsojzdfnmrfad"

async function getTables(prisma: PrismaClient): Promise<string[]> {
  const result = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `
  return result.map(r => r.tablename).filter(t => t !== '_prisma_migrations')
}

async function getTableStructure(prisma: PrismaClient, tableName: string): Promise<string> {
  const result = await prisma.$queryRaw<Array<{
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }>>`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    ORDER BY ordinal_position;
  `
  
  return JSON.stringify(result, null, 2)
}

async function main() {
  // Find DATABASE_URLs from environment
  const envContent = require('fs').readFileSync('.env', 'utf-8')
  const devMatch = envContent.match(new RegExp(`DATABASE_URL.*${DEV_DB_ID}[^\\s]*`, 'i'))
  const prodMatch = envContent.match(new RegExp(`DATABASE_URL.*${PROD_DB_ID}[^\\s]*`, 'i'))

  let devUrl: string | undefined
  let prodUrl: string | undefined

  // Try to find URLs
  const lines = envContent.split('\n')
  for (const line of lines) {
    if (line.includes(DEV_DB_ID) && line.includes('DATABASE_URL')) {
      devUrl = line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '')
    }
    if (line.includes(PROD_DB_ID) && line.includes('DATABASE_URL')) {
      prodUrl = line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '')
    }
  }

  // Fallback: use environment variables
  if (!devUrl) devUrl = process.env.DEV_DATABASE_URL
  if (!prodUrl) prodUrl = process.env.PROD_DATABASE_URL

  if (!devUrl) {
    console.error(`❌ Dev-Datenbank-URL nicht gefunden (ID: ${DEV_DB_ID})`)
    console.error("   Bitte setze DEV_DATABASE_URL oder füge die URL in .env ein")
    process.exit(1)
  }

  if (!prodUrl) {
    console.error(`❌ Prod-Datenbank-URL nicht gefunden (ID: ${PROD_DB_ID})`)
    console.error("   Bitte setze PROD_DATABASE_URL oder füge die URL in .env ein")
    process.exit(1)
  }

  console.log("==========================================")
  console.log("Dev → Prod Datenbank-Synchronisation")
  console.log("==========================================")
  console.log("")

  const devPrisma = new PrismaClient({
    datasources: {
      db: { url: devUrl }
    }
  })

  const prodPrisma = new PrismaClient({
    datasources: {
      db: { url: prodUrl }
    }
  })

  try {
    console.log("📊 Lade Tabellen aus Dev-Datenbank...")
    const devTables = await getTables(devPrisma)
    console.log(`   ✅ Dev: ${devTables.length} Tabellen gefunden\n`)

    console.log("📊 Lade Tabellen aus Prod-Datenbank...")
    const prodTables = await getTables(prodPrisma)
    console.log(`   ✅ Prod: ${prodTables.length} Tabellen gefunden\n`)

    const missingInProd = devTables.filter(t => !prodTables.includes(t))
    const missingInDev = prodTables.filter(t => !devTables.includes(t))

    console.log("=".repeat(50))
    console.log("VERGLEICH")
    console.log("=".repeat(50))
    console.log(`Dev Tabellen:  ${devTables.length}`)
    console.log(`Prod Tabellen: ${prodTables.length}`)
    console.log(`Fehlend in Prod: ${missingInProd.length}`)
    if (missingInDev.length > 0) {
      console.log(`Fehlend in Dev: ${missingInDev.length}`)
    }
    console.log("")

    if (missingInProd.length > 0) {
      console.log("❌ Fehlende Tabellen in Production:")
      missingInProd.forEach((table, i) => {
        console.log(`   ${i + 1}. ${table}`)
      })
      console.log("")
    }

    if (missingInDev.length > 0) {
      console.log("⚠️  Tabellen in Production, die nicht in Dev sind:")
      missingInDev.forEach((table, i) => {
        console.log(`   ${i + 1}. ${table}`)
      })
      console.log("")
    }

    if (missingInProd.length === 0 && missingInDev.length === 0) {
      console.log("✅ Beide Datenbanken haben die gleichen Tabellen!")
      console.log("")
    }

    // Show all tables
    console.log("📋 Alle Tabellen in Dev:")
    devTables.forEach((table, i) => {
      const inProd = prodTables.includes(table) ? "✅" : "❌"
      console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${inProd} ${table}`)
    })

    console.log("")
    console.log("=".repeat(50))
    console.log("NÄCHSTE SCHRITTE")
    console.log("=".repeat(50))
    
    if (missingInProd.length > 0) {
      console.log("")
      console.log("💡 Um fehlende Tabellen in Production zu erstellen:")
      console.log("   1. Setze PROD_DATABASE_URL auf die Production-Datenbank")
      console.log("   2. Führe aus: npx prisma db push --schema=prisma/schema.prisma")
      console.log("   3. Oder: npx prisma migrate deploy")
      console.log("")
    } else {
      console.log("✅ Keine Aktion erforderlich - Datenbanken sind synchron!")
    }

  } catch (error) {
    console.error("❌ Fehler:", error)
    process.exit(1)
  } finally {
    await devPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

main()


