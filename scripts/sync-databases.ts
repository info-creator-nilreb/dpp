/**
 * Sync Dev and Prod Databases
 * 
 * Compares tables and fields, then syncs missing tables/fields to production
 */

import { PrismaClient } from "@prisma/client"

interface TableInfo {
  name: string
  columns: ColumnInfo[]
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default: string | null
}

async function getTables(prisma: PrismaClient): Promise<string[]> {
  const result = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `
  return result.map(r => r.tablename)
}

async function getTableColumns(prisma: PrismaClient, tableName: string): Promise<ColumnInfo[]> {
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
  
  return result.map(col => ({
    name: col.column_name,
    type: col.data_type,
    nullable: col.is_nullable === 'YES',
    default: col.column_default
  }))
}

async function getTableInfo(prisma: PrismaClient, tableName: string): Promise<TableInfo> {
  const columns = await getTableColumns(prisma, tableName)
  return {
    name: tableName,
    columns
  }
}

async function main() {
  const devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL
  const prodUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL

  if (!devUrl) {
    console.error("❌ DEV_DATABASE_URL oder DATABASE_URL muss gesetzt sein")
    process.exit(1)
  }

  if (!prodUrl) {
    console.error("❌ PROD_DATABASE_URL muss gesetzt sein")
    process.exit(1)
  }

  console.log("📊 Vergleiche Datenbanken...\n")

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
    const devTables = await getTables(devPrisma)
    const prodTables = await getTables(prodPrisma)

    console.log(`🔵 Dev Datenbank: ${devTables.length} Tabellen`)
    console.log(`🟢 Prod Datenbank: ${prodTables.length} Tabellen\n`)

    const missingInProd = devTables.filter(t => !prodTables.includes(t))
    const missingInDev = prodTables.filter(t => !devTables.includes(t))

    if (missingInProd.length > 0) {
      console.log(`❌ Fehlende Tabellen in Production (${missingInProd.length}):`)
      missingInProd.forEach((table, i) => console.log(`   ${i + 1}. ${table}`))
      console.log("")
    } else {
      console.log("✅ Alle Tabellen sind in Production vorhanden\n")
    }

    if (missingInDev.length > 0) {
      console.log(`⚠️  Tabellen in Production, die nicht in Dev sind (${missingInDev.length}):`)
      missingInDev.forEach((table, i) => console.log(`   ${i + 1}. ${table}`))
      console.log("")
    }

    // Compare columns for existing tables
    const commonTables = devTables.filter(t => prodTables.includes(t))
    console.log(`\n📋 Vergleiche Spalten in ${commonTables.length} gemeinsamen Tabellen...\n`)

    let hasColumnDifferences = false
    for (const table of commonTables) {
      const devInfo = await getTableInfo(devPrisma, table)
      const prodInfo = await getTableInfo(prodPrisma, table)

      const devColumnNames = new Set(devInfo.columns.map(c => c.name))
      const prodColumnNames = new Set(prodInfo.columns.map(c => c.name))

      const missingInProdCols = devInfo.columns.filter(c => !prodColumnNames.has(c.name))
      const missingInDevCols = prodInfo.columns.filter(c => !devColumnNames.has(c.name))

      if (missingInProdCols.length > 0 || missingInDevCols.length > 0) {
        hasColumnDifferences = true
        console.log(`\n📊 Tabelle: ${table}`)
        if (missingInProdCols.length > 0) {
          console.log(`   ❌ Fehlende Spalten in Production:`)
          missingInProdCols.forEach(col => {
            console.log(`      - ${col.name} (${col.type}${col.nullable ? ', nullable' : ', not null'})`)
          })
        }
        if (missingInDevCols.length > 0) {
          console.log(`   ⚠️  Spalten in Production, die nicht in Dev sind:`)
          missingInDevCols.forEach(col => {
            console.log(`      - ${col.name} (${col.type})`)
          })
        }
      }
    }

    if (!hasColumnDifferences && missingInProd.length === 0) {
      console.log("✅ Keine Spalten-Unterschiede gefunden")
    }

    // Summary
    console.log("\n" + "=".repeat(50))
    console.log("📊 ZUSAMMENFASSUNG")
    console.log("=".repeat(50))
    console.log(`Dev Tabellen: ${devTables.length}`)
    console.log(`Prod Tabellen: ${prodTables.length}`)
    console.log(`Fehlende in Prod: ${missingInProd.length}`)
    console.log(`Unterschiedliche Spalten: ${hasColumnDifferences ? 'Ja' : 'Nein'}`)
    console.log("=".repeat(50))

    if (missingInProd.length > 0 || hasColumnDifferences) {
      console.log("\n💡 Nächste Schritte:")
      console.log("   1. Führe 'npx prisma migrate deploy' aus, um fehlende Tabellen/Spalten zu erstellen")
      console.log("   2. Oder verwende 'npx prisma db push' um das Schema zu synchronisieren")
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

