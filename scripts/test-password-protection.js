/**
 * Script zum Testen des Password Protection Passworts
 * 
 * Verwendung:
 * node scripts/test-password-protection.js <password>
 * 
 * Oder mit expliziter DB-URL:
 * DATABASE_URL="..." node scripts/test-password-protection.js <password>
 */

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function testPassword(password) {
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
    console.log(`   Enabled: ${config.passwordProtectionEnabled}`)
    console.log(`   Hash vorhanden: ${!!config.passwordProtectionPasswordHash}`)
    if (config.passwordProtectionPasswordHash) {
      console.log(`   Hash Länge: ${config.passwordProtectionPasswordHash.length}`)
      console.log(`   Hash Prefix: ${config.passwordProtectionPasswordHash.substring(0, 10)}...`)
    }

    if (!config.passwordProtectionPasswordHash) {
      console.log("❌ Kein Password Hash gesetzt")
      process.exit(1)
    }

    // Teste Passwort
    const trimmedPassword = password.trim()
    console.log(`\n🔍 Teste Passwort (Länge: ${trimmedPassword.length})...`)

    const isValid = await bcrypt.compare(trimmedPassword, config.passwordProtectionPasswordHash)
    
    if (isValid) {
      console.log("✅ Passwort ist GÜLTIG!")
    } else {
      console.log("❌ Passwort ist UNGÜLTIG!")
      
      // Zusätzliche Debug-Info
      console.log("\n🔍 Debug-Informationen:")
      console.log(`   Eingegebenes Passwort: "${trimmedPassword}"`)
      console.log(`   Passwort-Länge: ${trimmedPassword.length}`)
      console.log(`   Hash-Typ: ${config.passwordProtectionPasswordHash.startsWith('$2') ? 'bcrypt' : 'unbekannt'}`)
    }
  } catch (error) {
    console.error("❌ Fehler:", error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const password = process.argv[2]

if (!password) {
  console.log("❌ Bitte Passwort als Argument angeben")
  console.log("   Verwendung: node scripts/test-password-protection.js <password>")
  process.exit(1)
}

testPassword(password)

