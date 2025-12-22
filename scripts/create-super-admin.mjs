/**
 * Script zum Erstellen eines Super Admins
 * 
 * Usage: node scripts/create-super-admin.mjs
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "berlin.alexander@icloud.com"
  const password = "Harrypotter1207!d"
  
  // Prüfe ob Admin bereits existiert
  const existing = await prisma.superAdmin.findUnique({
    where: { email }
  })

  if (existing) {
    console.log(`Super Admin mit E-Mail ${email} existiert bereits.`)
    console.log("Passwort wird aktualisiert...")
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    await prisma.superAdmin.update({
      where: { email },
      data: {
        passwordHash,
        isActive: true
      }
    })
    
    console.log("✅ Passwort wurde aktualisiert.")
    return
  }

  // Hash Passwort
  const passwordHash = await bcrypt.hash(password, 10)

  // Erstelle Super Admin
  const admin = await prisma.superAdmin.create({
    data: {
      email,
      passwordHash,
      name: "Alexander Berlin",
      role: "super_admin",
      isActive: true
    }
  })

  console.log("✅ Super Admin erfolgreich erstellt:")
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Name: ${admin.name}`)
  console.log(`   Rolle: ${admin.role}`)
}

main()
  .catch((error) => {
    console.error("Fehler:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

