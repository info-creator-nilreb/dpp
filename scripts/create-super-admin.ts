/**
 * Script zum Erstellen oder Aktualisieren eines Super Admin Users
 * 
 * Verwendung:
 * npx tsx scripts/create-super-admin.ts <email>
 * 
 * Beispiel:
 * npx tsx scripts/create-super-admin.ts admin@example.com
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function createSuperAdmin(email: string) {
  try {
    // Suche nach User mit dieser E-Mail
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // User existiert bereits - setze systemRole auf SUPER_ADMIN
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          systemRole: "SUPER_ADMIN",
          isPlatformAdmin: true, // Für Backward Compatibility
        },
      })

      console.log(`✅ User ${email} wurde als SUPER_ADMIN aktualisiert`)
      console.log(`   User ID: ${updatedUser.id}`)
      console.log(`   Name: ${updatedUser.name || "Nicht gesetzt"}`)
      console.log(`   System-Rolle: ${updatedUser.systemRole}`)
    } else {
      console.error(`❌ User mit E-Mail ${email} wurde nicht gefunden.`)
      console.log(`   Bitte erstellen Sie zuerst einen Account über die Registrierung.`)
      console.log(`   Dann führen Sie dieses Script erneut aus.`)
      process.exit(1)
    }
  } catch (error) {
    console.error("Fehler beim Erstellen des Super Admins:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Hauptfunktion
const email = process.argv[2]

if (!email) {
  console.error("❌ Bitte geben Sie eine E-Mail-Adresse an")
  console.log("Verwendung: npx tsx scripts/create-super-admin.ts <email>")
  console.log("Beispiel: npx tsx scripts/create-super-admin.ts admin@example.com")
  process.exit(1)
}

createSuperAdmin(email)

