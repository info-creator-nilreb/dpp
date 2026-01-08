/**
 * Script zum Setzen des Password Protection Passworts in PROD
 * 
 * Verwendung:
 * node scripts/set-prod-password.js <password>
 */

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const PROD_CONN = "postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

const prisma = new PrismaClient({ datasources: { db: { url: PROD_CONN } } })

async function setPassword(password) {
  try {
    // Hole bestehende Config
    const existing = await prisma.passwordProtectionConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    })

    if (!existing) {
      console.log("❌ Keine Password Protection Config gefunden - kann nicht aktualisieren")
      process.exit(1)
    }

    console.log("✅ Config gefunden")
    console.log(`   ID: ${existing.id}`)
    console.log(`   Aktueller Hash: ${existing.passwordProtectionPasswordHash ? existing.passwordProtectionPasswordHash.substring(0, 30) + '...' : 'KEIN HASH'}`)

    // Hash das Passwort
    const trimmedPassword = password.trim()
    console.log(`\n🔐 Hashe Passwort (Länge: ${trimmedPassword.length})...`)
    const passwordHash = await bcrypt.hash(trimmedPassword, 10)
    console.log(`   Hash: ${passwordHash.substring(0, 30)}...`)

    // Update Config
    console.log("\n📝 Aktualisiere Config...")
    await prisma.passwordProtectionConfig.update({
      where: { id: existing.id },
      data: {
        passwordProtectionPasswordHash: passwordHash,
        updatedBy: "migration-script",
      },
    })

    console.log("✅ Passwort erfolgreich gesetzt!")

    // Teste das Passwort direkt
    console.log("\n🔍 Teste das gesetzte Passwort...")
    const isValid = await bcrypt.compare(trimmedPassword, passwordHash)
    if (isValid) {
      console.log("✅ Passwort-Test erfolgreich!")
    } else {
      console.log("❌ Passwort-Test fehlgeschlagen - das sollte nicht passieren!")
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
  console.log("   Verwendung: node scripts/set-prod-password.js <password>")
  process.exit(1)
}

setPassword(password)

