/**
 * Script zum Prüfen ob die Datenbank-Schema-Felder vorhanden sind
 */

const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function checkSchema() {
  try {
    // Versuche einen User zu finden und zu aktualisieren (ohne tatsächlich etwas zu ändern)
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log("❌ Kein User in der Datenbank gefunden")
      return
    }

    console.log(`✅ User gefunden: ${user.email}`)
    
    // Prüfe ob passwordResetToken-Feld existiert
    try {
      const testUpdate = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null, // Setze auf null (sollte funktionieren)
        },
        select: {
          id: true,
          email: true,
          passwordResetToken: true,
          passwordResetTokenExpires: true,
          totpSecret: true,
          totpEnabled: true,
        }
      })
      
      console.log("✅ Alle neuen Felder sind vorhanden:")
      console.log("   - passwordResetToken:", testUpdate.passwordResetToken !== undefined ? "✅" : "❌")
      console.log("   - passwordResetTokenExpires:", testUpdate.passwordResetTokenExpires !== undefined ? "✅" : "❌")
      console.log("   - totpSecret:", testUpdate.totpSecret !== undefined ? "✅" : "❌")
      console.log("   - totpEnabled:", testUpdate.totpEnabled !== undefined ? "✅" : "❌")
    } catch (error) {
      console.error("❌ Fehler beim Prüfen der Felder:", error.message)
      if (error.message.includes("Unknown argument")) {
        console.error("   → Die Datenbank-Schema-Felder fehlen!")
        console.error("   → Führen Sie aus: npx prisma db push --accept-data-loss")
      }
    }
  } catch (error) {
    console.error("Fehler:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()

