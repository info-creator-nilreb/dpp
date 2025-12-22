/**
 * Script zum Erstellen eines Super Admins
 * 
 * Usage: 
 *   Lokal: node scripts/create-super-admin.mjs
 *   Production: 
 *     SUPER_ADMIN_EMAIL="admin@example.com" \
 *     SUPER_ADMIN_PASSWORD="secure-password" \
 *     DATABASE_URL="postgresql://..." \
 *     node scripts/create-super-admin.mjs
 * 
 * Environment Variables:
 *   - SUPER_ADMIN_EMAIL: E-Mail des Super Admins (optional, Fallback: berlin.alexander@icloud.com)
 *   - SUPER_ADMIN_PASSWORD: Passwort des Super Admins (optional, Fallback: Harrypotter1207!d)
 *   - SUPER_ADMIN_NAME: Name des Super Admins (optional, Fallback: Alexander Berlin)
 *   - DATABASE_URL: Datenbank-URL (aus .env.local für lokal, oder als Umgebungsvariable für Production)
 * 
 * Security:
 *   - Für Production: IMMER Umgebungsvariablen verwenden, nicht hardcodierte Werte
 *   - Das Script zeigt welche Datenbank verwendet wird (ohne sensibles Passwort)
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Zeige welche Datenbank verwendet wird (ohne Passwort)
  const dbUrl = process.env.DATABASE_URL || "nicht gesetzt"
  const dbDisplay = dbUrl.includes("@") 
    ? dbUrl.split("@")[1] 
    : dbUrl.substring(0, 50) + "..."
  
  console.log("📊 Datenbank:", dbDisplay)
  console.log("")

  // Credentials aus Umgebungsvariablen oder Fallback-Werte für lokale Entwicklung
  const email = process.env.SUPER_ADMIN_EMAIL || "berlin.alexander@icloud.com"
  const password = process.env.SUPER_ADMIN_PASSWORD || "Harrypotter1207!d"
  const name = process.env.SUPER_ADMIN_NAME || "Alexander Berlin"
  
  // Warnung wenn Fallback-Werte verwendet werden
  if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) {
    console.log("⚠️  Hinweis: Verwende Fallback-Credentials (für lokale Entwicklung)")
    console.log("   Für Production: SUPER_ADMIN_EMAIL und SUPER_ADMIN_PASSWORD als Umgebungsvariablen setzen")
    console.log("")
  }
  
  // Prüfe ob Admin bereits existiert
  const existing = await prisma.superAdmin.findUnique({
    where: { email }
  })

  if (existing) {
    console.log(`⚠️  Super Admin mit E-Mail ${email} existiert bereits.`)
    console.log("🔄 Passwort wird aktualisiert...")
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    await prisma.superAdmin.update({
      where: { email },
      data: {
        passwordHash,
        isActive: true
      }
    })
    
    console.log("✅ Passwort wurde aktualisiert.")
    console.log("")
    console.log("🔑 Login-Credentials:")
    console.log(`   E-Mail: ${email}`)
    if (process.env.SUPER_ADMIN_PASSWORD) {
      console.log(`   Passwort: [aus Umgebungsvariable]`)
    } else {
      console.log(`   Passwort: ${password}`)
    }
    console.log(`   Route: /super-admin/login`)
    return
  }

  // Hash Passwort
  const passwordHash = await bcrypt.hash(password, 10)

  // Erstelle Super Admin
  const admin = await prisma.superAdmin.create({
    data: {
      email,
      passwordHash,
      name,
      role: "super_admin",
      isActive: true
    }
  })

  console.log("✅ Super Admin erfolgreich erstellt!")
  console.log("")
  console.log("📋 Details:")
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Name: ${admin.name}`)
  console.log(`   Rolle: ${admin.role}`)
  console.log("")
  console.log("🔑 Login-Credentials:")
  console.log(`   E-Mail: ${email}`)
  if (process.env.SUPER_ADMIN_PASSWORD) {
    console.log(`   Passwort: [aus Umgebungsvariable SUPER_ADMIN_PASSWORD]`)
  } else {
    console.log(`   Passwort: ${password}`)
  }
  console.log(`   Route: /super-admin/login`)
}

main()
  .catch((error) => {
    console.error("Fehler:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

