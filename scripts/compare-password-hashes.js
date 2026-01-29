/**
 * Script zum Vergleichen der Password Protection Hashes zwischen DEV und PROD
 * 
 * Verwendung:
 * node scripts/compare-password-hashes.js
 */

const { PrismaClient } = require("@prisma/client")

const DEV_CONN = "postgresql://postgres:Harrypotter1207!s@db.jhxdwgnvmbnxjwiaodtj.supabase.co:5432/postgres"
const PROD_CONN = "postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

async function compareHashes() {
  let devPrisma, prodPrisma
  
  try {
    // Verbinde mit DEV
    console.log("🔄 Verbinde mit DEV...")
    devPrisma = new PrismaClient({ datasources: { db: { url: DEV_CONN } } })
    const devConfig = await devPrisma.passwordProtectionConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    })
    
    // Verbinde mit PROD
    console.log("🔄 Verbinde mit PROD...")
    prodPrisma = new PrismaClient({ datasources: { db: { url: PROD_CONN } } })
    const prodConfig = await prodPrisma.passwordProtectionConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    })
    
    console.log("\n📊 Vergleich:")
    
    if (!devConfig) {
      console.log("❌ Keine Config in DEV gefunden")
    } else {
      console.log("✅ DEV Config gefunden")
      console.log(`   Enabled: ${devConfig.passwordProtectionEnabled}`)
      console.log(`   Hash: ${devConfig.passwordProtectionPasswordHash ? devConfig.passwordProtectionPasswordHash.substring(0, 30) + '...' : 'KEIN HASH'}`)
      console.log(`   Updated: ${devConfig.updatedAt}`)
    }
    
    if (!prodConfig) {
      console.log("❌ Keine Config in PROD gefunden")
    } else {
      console.log("✅ PROD Config gefunden")
      console.log(`   Enabled: ${prodConfig.passwordProtectionEnabled}`)
      console.log(`   Hash: ${prodConfig.passwordProtectionPasswordHash ? prodConfig.passwordProtectionPasswordHash.substring(0, 30) + '...' : 'KEIN HASH'}`)
      console.log(`   Updated: ${prodConfig.updatedAt}`)
    }
    
    if (devConfig && prodConfig) {
      console.log("\n🔍 Vergleich:")
      if (devConfig.passwordProtectionPasswordHash === prodConfig.passwordProtectionPasswordHash) {
        console.log("✅ Hashes sind IDENTISCH")
      } else {
        console.log("⚠️  Hashes sind UNTERSCHIEDLICH")
        console.log(`   DEV Hash Länge: ${devConfig.passwordProtectionPasswordHash?.length || 0}`)
        console.log(`   PROD Hash Länge: ${prodConfig.passwordProtectionPasswordHash?.length || 0}`)
        console.log(`   DEV Hash Prefix: ${devConfig.passwordProtectionPasswordHash?.substring(0, 20) || 'N/A'}`)
        console.log(`   PROD Hash Prefix: ${prodConfig.passwordProtectionPasswordHash?.substring(0, 20) || 'N/A'}`)
      }
    }
    
  } catch (error) {
    console.error("❌ Fehler:", error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    if (devPrisma) await devPrisma.$disconnect()
    if (prodPrisma) await prodPrisma.$disconnect()
  }
}

compareHashes()

