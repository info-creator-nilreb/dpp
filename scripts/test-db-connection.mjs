#!/usr/bin/env node

/**
 * Test Database Connection
 * 
 * Prüft die Verbindung zur Datenbank und gibt hilfreiche Fehlermeldungen aus
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

async function testConnection() {
  console.log('🔍 Teste Datenbankverbindung...\n')
  
  // Prüfe DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL ist nicht gesetzt!')
    console.log('\n💡 Bitte setze DATABASE_URL in deiner .env Datei:')
    console.log('   DATABASE_URL="postgresql://user:password@host:port/database"')
    process.exit(1)
  }
  
  // Zeige DATABASE_URL (ohne Passwort)
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@')
  console.log(`📋 DATABASE_URL: ${maskedUrl}\n`)
  
  try {
    // Versuche einfache Query
    console.log('⏳ Versuche Verbindung zur Datenbank...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Verbindung erfolgreich!')
    console.log(`   Test-Query Ergebnis: ${JSON.stringify(result)}\n`)
    
    // Versuche User-Tabelle zu lesen
    console.log('⏳ Teste Zugriff auf User-Tabelle...')
    const userCount = await prisma.user.count()
    console.log(`✅ User-Tabelle erreichbar! (${userCount} Benutzer gefunden)\n`)
    
    console.log('✅ Alle Tests erfolgreich!')
  } catch (error) {
    console.error('\n❌ Fehler bei der Datenbankverbindung:\n')
    console.error(error.message)
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Mögliche Lösungen:')
      console.log('   1. Prüfe ob die Datenbank in Supabase aktiv ist (nicht pausiert)')
      console.log('   2. Prüfe ob die DATABASE_URL korrekt ist')
      console.log('   3. Prüfe deine Internetverbindung')
      console.log('   4. Prüfe ob Firewall/VPN die Verbindung blockiert')
      console.log('   5. Versuche die Datenbank in Supabase zu "resume" (wenn pausiert)')
    } else if (error.message.includes("authentication failed")) {
      console.log('\n💡 Authentifizierungsfehler:')
      console.log('   1. Prüfe ob das Passwort in DATABASE_URL korrekt ist')
      console.log('   2. Prüfe ob der Benutzer existiert')
    } else if (error.message.includes("does not exist")) {
      console.log('\n💡 Datenbank nicht gefunden:')
      console.log('   1. Prüfe ob der Datenbankname in DATABASE_URL korrekt ist')
      console.log('   2. Prüfe ob die Datenbank in Supabase existiert')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection().catch(console.error)
