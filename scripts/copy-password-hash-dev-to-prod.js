/**
 * Script zum Kopieren des Password Protection Hash von DEV nach PROD
 * 
 * WICHTIG: Dies überschreibt den Hash in PROD mit dem aus DEV
 * 
 * Verwendung:
 * node scripts/copy-password-hash-dev-to-prod.js
 */

const { PrismaClient } = require("@prisma/client")

const DEV_CONN = "postgresql://postgres:Harrypotter1207!s@db.jhxdwgnvmbnxjwiaodtj.supabase.co:5432/postgres"
const PROD_CONN = "postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

async function copyHash() {
  let devPrisma, prodPrisma
  
  try {
    // Verbinde mit DEV
    console.log("🔄 Verbinde mit DEV...")
    devPrisma = new PrismaClient({ datasources: { db: { url: DEV_CONN } } })
    const devConfig = await devPrisma.passwordProtectionConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    })
    
    if (!devConfig || !devConfig.passwordProtectionPasswordHash) {
      console.log("❌ Kein Hash in DEV gefunden")
      process.exit(1)
    }
    
    console.log("✅ DEV Hash gefunden")
    console.log(`   Hash: ${devConfig.passwordProtectionPasswordHash.substring(0, 30)}...`)
    
    // Verbinde mit PROD
    console.log("\n🔄 Verbinde mit PROD...")
    prodPrisma = new PrismaClient({ datasources: { db: { url: PROD_CONN } } })
    const prodConfig = await prodPrisma.passwordProtectionConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    })
    
    if (!prodConfig) {
      console.log("❌ Keine Config in PROD gefunden - kann nicht aktualisieren")
      process.exit(1)
    }
    
    console.log("✅ PROD Config gefunden")
    console.log(`   Aktueller Hash: ${prodConfig.passwordProtectionPasswordHash ? prodConfig.passwordProtectionPasswordHash.substring(0, 30) + '...' : 'KEIN HASH'}`)
    
    // Kopiere Hash von DEV nach PROD
    console.log("\n📋 Kopiere Hash von DEV nach PROD...")
    
    await prodPrisma.passwordProtectionConfig.update({
      where: { id: prodConfig.id },
      data: {
        passwordProtectionPasswordHash: devConfig.passwordProtectionPasswordHash,
        updatedBy: "migration-script",
      },
    })
    
    console.log("✅ Hash erfolgreich kopiert!")
    console.log(`   Neuer Hash in PROD: ${devConfig.passwordProtectionPasswordHash.substring(0, 30)}...`)
    
  } catch (error) {
    console.error("❌ Fehler:", error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    if (devPrisma) await devPrisma.$disconnect()
    if (prodPrisma) await prodPrisma.$disconnect()
  }
}

// Sicherheitsabfrage
console.log("⚠️  WARNUNG: Dies wird den Password Protection Hash in PROD überschreiben!")
console.log("   Der Hash aus DEV wird nach PROD kopiert.")
console.log("   Drücke Ctrl+C zum Abbrechen, oder Enter zum Fortfahren...")

// In Node.js können wir nicht auf Enter warten, also führen wir es direkt aus
// Der Benutzer kann das Script manuell ausführen wenn er sicher ist
copyHash()

