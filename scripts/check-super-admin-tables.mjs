/**
 * Script zum Prüfen, ob Super Admin Tabellen in der Datenbank existieren
 * 
 * Usage:
 *   Lokal: node scripts/check-super-admin-tables.mjs
 *   Production: DATABASE_URL="postgresql://..." node scripts/check-super-admin-tables.mjs
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const dbUrl = process.env.DATABASE_URL || "nicht gesetzt"
  const dbDisplay = dbUrl.includes("@") 
    ? dbUrl.split("@")[1].split("/")[0]
    : dbUrl.substring(0, 50)
  
  console.log("📊 Prüfe Datenbank:", dbDisplay)
  console.log("")

  const tablesToCheck = [
    "super_admins",
    "super_admin_2fa",
    "super_admin_sessions",
    "audit_logs"
  ]

  const results = []

  for (const tableName of tablesToCheck) {
    try {
      // Prüfe ob Tabelle existiert, indem wir versuchen, einen Eintrag zu zählen
      const result = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        tableName
      )
      
      const exists = result[0]?.count > 0
      
      if (exists) {
        // Prüfe Anzahl Einträge in der Tabelle
        const countResult = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM ${tableName}`
        )
        const count = parseInt(countResult[0]?.count || 0)
        
        results.push({
          table: tableName,
          exists: true,
          count
        })
        console.log(`✅ ${tableName}: existiert (${count} Einträge)`)
      } else {
        results.push({
          table: tableName,
          exists: false,
          count: 0
        })
        console.log(`❌ ${tableName}: existiert NICHT`)
      }
    } catch (error) {
      results.push({
        table: tableName,
        exists: false,
        error: error.message
      })
      console.log(`❌ ${tableName}: Fehler - ${error.message}`)
    }
  }

  console.log("")
  console.log("📋 Zusammenfassung:")
  const existingTables = results.filter(r => r.exists)
  const missingTables = results.filter(r => !r.exists)
  
  if (existingTables.length === tablesToCheck.length) {
    console.log("✅ Alle Tabellen existieren!")
  } else {
    console.log(`⚠️  ${existingTables.length}/${tablesToCheck.length} Tabellen existieren`)
    if (missingTables.length > 0) {
      console.log("")
      console.log("Fehlende Tabellen:")
      missingTables.forEach(t => console.log(`  - ${t.table}`))
      console.log("")
      console.log("💡 Lösung: Migration in Production ausführen:")
      console.log("   DATABASE_URL=\"postgresql://...\" npx prisma migrate deploy")
    }
  }
}

main()
  .catch((error) => {
    console.error("Fehler:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

