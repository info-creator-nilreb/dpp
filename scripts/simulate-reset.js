/**
 * Script zum Simulieren eines Passwort-Resets
 */

const { PrismaClient } = require("@prisma/client")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function simulateReset(email, newPassword) {
  try {
    console.log(`Teste Passwort-Reset für ${email}...`)
    
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("❌ User nicht gefunden")
      process.exit(1)
    }

    console.log(`✅ User gefunden: ${user.email}`)

    // Generiere Reset-Token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpires = new Date()
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1)

    console.log(`Generierter Token: ${resetToken.substring(0, 20)}...`)

    // Speichere Token
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetTokenExpires: resetTokenExpires,
        },
      })
      console.log("✅ Token gespeichert")
    } catch (dbError) {
      console.error("❌ Fehler beim Speichern:", dbError.message)
      throw dbError
    }

    // Teste E-Mail-Versand (simuliert)
    console.log("\n=== E-Mail-Versand (Development Mode) ===")
    const resetUrl = `http://localhost:3001/reset-password?token=${resetToken}`
    console.log(`Reset-URL: ${resetUrl}`)
    console.log(`\nKopieren Sie diesen Link und öffnen Sie ihn im Browser\n`)

  } catch (error) {
    console.error("Fehler:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2] || "berlin.alexander@icloud.com"
simulateReset(email)

