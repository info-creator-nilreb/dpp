/**
 * Script zum Testen des Password Protection Passworts in PROD
 * 
 * Verwendung:
 * node scripts/test-prod-password.js <password>
 */

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const PROD_CONN = "postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

const prisma = new PrismaClient({ datasources: { db: { url: PROD_CONN } } })

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
    console.log(`   ID: ${config.id}`)
    console.log(`   Enabled: ${config.passwordProtectionEnabled}`)
    console.log(`   Hash vorhanden: ${!!config.passwordProtectionPasswordHash}`)
    if (config.passwordProtectionPasswordHash) {
      console.log(`   Hash Länge: ${config.passwordProtectionPasswordHash.length}`)
      console.log(`   Hash Prefix: ${config.passwordProtectionPasswordHash.substring(0, 30)}...`)
      console.log(`   Hash Typ: ${config.passwordProtectionPasswordHash.startsWith('$2') ? 'bcrypt' : 'unbekannt'}`)
      console.log(`   Updated At: ${config.updatedAt}`)
      console.log(`   Updated By: ${config.updatedBy || 'N/A'}`)
    }

    if (!config.passwordProtectionPasswordHash) {
      console.log("❌ Kein Password Hash gesetzt")
      process.exit(1)
    }

    // Teste Passwort
    const trimmedPassword = password.trim()
    console.log(`\n🔍 Teste Passwort (Länge: ${trimmedPassword.length})...`)
    console.log(`   Passwort (erste 5 Zeichen): "${trimmedPassword.substring(0, 5)}..."`)

    // Prüfe Hash-Format
    if (!config.passwordProtectionPasswordHash.startsWith('$2')) {
      console.log("❌ Hash-Format ist ungültig (sollte mit $2 beginnen)")
      process.exit(1)
    }

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
      console.log(`   Hash vollständig: ${config.passwordProtectionPasswordHash}`)
      
      // Teste verschiedene Varianten
      console.log("\n🔍 Teste verschiedene Varianten:")
      
      // Ohne Trim
      const isValidNoTrim = await bcrypt.compare(password, config.passwordProtectionPasswordHash)
      console.log(`   Ohne Trim: ${isValidNoTrim ? '✅' : '❌'}`)
      
      // Mit zusätzlichen Leerzeichen
      const isValidWithSpaces = await bcrypt.compare(` ${trimmedPassword} `, config.passwordProtectionPasswordHash)
      console.log(`   Mit Leerzeichen: ${isValidWithSpaces ? '✅' : '❌'}`)
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
  console.log("   Verwendung: node scripts/test-prod-password.js <password>")
  process.exit(1)
}

testPassword(password)

