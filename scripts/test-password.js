/**
 * Script zum Testen des Passworts eines Users
 * 
 * Verwendung:
 * node scripts/test-password.js <email> <password>
 */

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function testPassword(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
      },
    })

    if (!user) {
      console.log(`❌ User mit E-Mail ${email} nicht gefunden`)
      process.exit(1)
    }

    console.log(`✅ User gefunden: ${user.name || user.email}`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Password Hash: ${user.password.substring(0, 20)}...`)

    const isValid = await bcrypt.compare(password, user.password)
    
    if (isValid) {
      console.log(`✅ Passwort ist gültig!`)
    } else {
      console.log(`❌ Passwort ist ungültig!`)
    }
  } catch (error) {
    console.error("Fehler:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error("❌ Bitte geben Sie E-Mail und Passwort an")
  console.log("Verwendung: node scripts/test-password.js <email> <password>")
  process.exit(1)
}

testPassword(email, password)

