/**
 * Script zum Zurücksetzen des Passworts eines Users (Admin-Tool)
 * 
 * Verwendung:
 * node scripts/reset-password-admin.js <email> <neues-passwort>
 * 
 * Beispiel:
 * node scripts/reset-password-admin.js admin@example.com NeuesPasswort123!
 */

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function resetPassword(email, newPassword) {
  try {
    // Suche nach User mit dieser E-Mail
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!existingUser) {
      console.error(`❌ User mit E-Mail ${email} wurde nicht gefunden.`)
      process.exit(1)
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Passwort aktualisieren
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
      },
    })

    console.log(`✅ Passwort für ${email} wurde erfolgreich zurückgesetzt`)
    console.log(`   User ID: ${updatedUser.id}`)
    console.log(`   Name: ${updatedUser.name || "Nicht gesetzt"}`)
    console.log(`   System-Rolle: ${updatedUser.systemRole || "Keine"}`)
    console.log(`   E-Mail verifiziert: ${updatedUser.emailVerified ? "Ja" : "Nein"}`)
    console.log(`\n   Sie können sich jetzt mit dem neuen Passwort anmelden.`)
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Hauptfunktion
const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error("❌ Bitte geben Sie E-Mail-Adresse und neues Passwort an")
  console.log("Verwendung: node scripts/reset-password-admin.js <email> <neues-passwort>")
  console.log("Beispiel: node scripts/reset-password-admin.js admin@example.com NeuesPasswort123!")
  process.exit(1)
}

if (password.length < 8) {
  console.error("❌ Passwort muss mindestens 8 Zeichen lang sein")
  process.exit(1)
}

resetPassword(email, password)

