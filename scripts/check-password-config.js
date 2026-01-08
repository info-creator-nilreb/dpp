/**
 * Script zum Prüfen der Password Protection Config (ohne Passwort-Test)
 * 
 * Verwendung:
 * DATABASE_URL="..." node scripts/check-password-config.js
 */

const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function checkConfig() {
  try {
    // Hole Password Protection Config
    const config = await prisma.passwordProtectionConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    })

    if (!config) {
      console.log("❌ Keine Password Protection Config gefunden")
      process.exit(1)
    }

    console.log("✅ Password Protection Config gefunden")
    console.log(`   ID: ${config.id}`)
    console.log(`   Enabled: ${config.passwordProtectionEnabled}`)
    console.log(`   Start Date: ${config.passwordProtectionStartDate}`)
    console.log(`   End Date: ${config.passwordProtectionEndDate}`)
    console.log(`   Session Timeout: ${config.passwordProtectionSessionTimeoutMinutes} Minuten`)
    console.log(`   Updated At: ${config.updatedAt}`)
    console.log(`   Updated By: ${config.updatedBy || 'N/A'}`)
    
    if (config.passwordProtectionPasswordHash) {
      console.log(`\n✅ Password Hash vorhanden:`)
      console.log(`   Hash Länge: ${config.passwordProtectionPasswordHash.length}`)
      console.log(`   Hash Prefix: ${config.passwordProtectionPasswordHash.substring(0, 20)}...`)
      console.log(`   Hash Typ: ${config.passwordProtectionPasswordHash.startsWith('$2') ? 'bcrypt' : 'unbekannt'}`)
      
      // Prüfe Hash-Format
      if (config.passwordProtectionPasswordHash.startsWith('$2a$') || 
          config.passwordProtectionPasswordHash.startsWith('$2b$') || 
          config.passwordProtectionPasswordHash.startsWith('$2y$')) {
        console.log(`   ✅ Hash-Format: Gültiger bcrypt Hash`)
      } else {
        console.log(`   ⚠️  Hash-Format: Unerwartetes Format`)
      }
    } else {
      console.log(`\n❌ Kein Password Hash gesetzt`)
    }
    
    // Prüfe ob Protection aktiv ist
    const now = new Date()
    let isActive = false
    
    if (config.passwordProtectionEnabled) {
      isActive = true
    } else if (config.passwordProtectionStartDate && config.passwordProtectionEndDate) {
      isActive = now >= config.passwordProtectionStartDate && now <= config.passwordProtectionEndDate
    } else if (config.passwordProtectionStartDate) {
      isActive = now >= config.passwordProtectionStartDate
    } else if (config.passwordProtectionEndDate) {
      isActive = now <= config.passwordProtectionEndDate
    }
    
    console.log(`\n📊 Status:`)
    console.log(`   Protection aktiv: ${isActive ? '✅ JA' : '❌ NEIN'}`)
    
  } catch (error) {
    console.error("❌ Fehler:", error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkConfig()

