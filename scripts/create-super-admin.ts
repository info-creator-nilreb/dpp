/**
 * Create Super Admin Script
 * 
 * Creates a new Super Admin with the specified credentials
 * Usage: npx tsx scripts/create-super-admin.ts
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { readFileSync } from "fs"
import { join } from "path"

// Load .env manually if needed
try {
  const envPath = join(process.cwd(), ".env")
  const envFile = readFileSync(envPath, "utf-8")
  envFile.split("\n").forEach((line) => {
    const [key, ...values] = line.split("=")
    if (key && values.length > 0) {
      const value = values.join("=").trim().replace(/^["']|["']$/g, "")
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value
      }
    }
  })
} catch (error) {
  // .env file not found, use environment variables
}

const prisma = new PrismaClient()

async function createSuperAdmin() {
  const email = "admin"
  const password = "nimda"
  const name = "Super Admin"

  try {
    // Check if Super Admin already exists
    const existing = await prisma.superAdmin.findUnique({
      where: { email }
    })

    if (existing) {
      console.log("⚠️  Super Admin mit E-Mail 'admin' existiert bereits.")
      console.log("   Möchten Sie das Passwort aktualisieren? (y/n)")
      // For now, we'll just update the password
      const passwordHash = await bcrypt.hash(password, 10)
      await prisma.superAdmin.update({
        where: { email },
        data: { passwordHash }
      })
      console.log("✅ Passwort wurde aktualisiert.")
      return
    }

    // Hash password
    console.log("🔐 Hashe Passwort...")
    const passwordHash = await bcrypt.hash(password, 10)

    // Create Super Admin
    console.log("👤 Erstelle Super Admin...")
    const superAdmin = await prisma.superAdmin.create({
      data: {
        email,
        passwordHash,
        name,
        role: "super_admin", // Highest role
        isActive: true
      }
    })

    console.log("✅ Super Admin erfolgreich erstellt!")
    console.log("")
    console.log("📋 Details:")
    console.log(`   ID: ${superAdmin.id}`)
    console.log(`   E-Mail: ${superAdmin.email}`)
    console.log(`   Name: ${superAdmin.name}`)
    console.log(`   Rolle: ${superAdmin.role}`)
    console.log(`   Aktiv: ${superAdmin.isActive}`)
    console.log("")
    console.log("🔑 Login-Credentials:")
    console.log(`   E-Mail: ${email}`)
    console.log(`   Passwort: ${password}`)
    console.log("")
    console.log("🌐 Login-URL: /super-admin/login")

  } catch (error: any) {
    console.error("❌ Fehler beim Erstellen des Super Admins:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()

