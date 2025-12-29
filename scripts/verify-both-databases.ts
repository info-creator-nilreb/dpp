/**
 * Verify both databases have the same tables
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
  return result.map(r => r.tablename).filter(t => t !== '_prisma_migrations').sort()
}

async function main() {
  const fs = require('fs')
  const envContent = fs.readFileSync('.env', 'utf-8')
  const devUrlMatch = envContent.match(/DATABASE_URL=(.+)/)
  
  if (!devUrlMatch) {
    console.error("❌ DATABASE_URL nicht in .env gefunden")
    process.exit(1)
  }

  const devUrl = devUrlMatch[1].trim().replace(/^["']|["']$/g, '')
  const prodUrl = devUrl.replace(DEV_DB_ID, PROD_DB_ID)

  console.log("==========================================")
  console.log("Datenbank-Vergleich: Dev vs. Prod")
  console.log("==========================================")
  console.log("")

  const devPrisma = new PrismaClient({
    datasources: { db: { url: devUrl } }
  })

  const prodPrisma = new PrismaClient({
    datasources: { db: { url: prodUrl } }
  })

  try {
    const devTables = await getTables(devPrisma)
    const prodTables = await getTables(prodPrisma)

    console.log(`🔵 Dev (${DEV_DB_ID}):  ${devTables.length} Tabellen`)
    console.log(`🟢 Prod (${PROD_DB_ID}): ${prodTables.length} Tabellen`)
    console.log("")

    const missingInProd = devTables.filter(t => !prodTables.includes(t))
    const missingInDev = prodTables.filter(t => !devTables.includes(t))

    if (missingInProd.length === 0 && missingInDev.length === 0 && devTables.length === prodTables.length) {
      console.log("✅ BEIDE DATENBANKEN SIND IDENTISCH!")
      console.log("")
      console.log("📋 Alle Tabellen (beide DBs):")
      devTables.forEach((table, i) => {
        console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${table}`)
      })
    } else {
      if (missingInProd.length > 0) {
        console.log(`❌ Fehlend in Prod (${missingInProd.length}):`)
        missingInProd.forEach(t => console.log(`   - ${t}`))
        console.log("")
      }
      if (missingInDev.length > 0) {
        console.log(`⚠️  Fehlend in Dev (${missingInDev.length}):`)
        missingInDev.forEach(t => console.log(`   - ${t}`))
        console.log("")
      }
      console.log("⚠️  Datenbanken sind NICHT identisch!")
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


