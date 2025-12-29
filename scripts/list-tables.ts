/**
 * List all tables in database
 */

import { PrismaClient } from "@prisma/client"

async function main() {
  const prisma = new PrismaClient()

  try {
    // Get all tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `

    // Filter out _prisma_migrations
    const userTables = tables.filter(t => t.tablename !== '_prisma_migrations')
    
    console.log(`📊 Gefundene Tabellen: ${userTables.length} (${tables.length} inkl. System-Tabellen)\n`)
    userTables.forEach((table, i) => {
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${table.tablename}`)
    })

    console.log(`\n✅ Gesamt: ${userTables.length} Benutzer-Tabellen`)
  } catch (error) {
    console.error("❌ Fehler:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

