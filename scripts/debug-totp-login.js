/**
 * Debug-Script für TOTP-Login
 * 
 * Testet ob das Secret in der DB korrekt ist und Codes generiert werden können
 */

const { PrismaClient } = require("@prisma/client")
const { authenticator } = require("otplib")

const prisma = new PrismaClient()

async function debugTotp() {
  try {
    const email = "berlin.alexander@icloud.com"
    
    console.log("=== Suche User ===")
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        totpEnabled: true,
        totpSecret: true,
        systemRole: true,
        isPlatformAdmin: true
      }
    })

    if (!user) {
      console.error("User nicht gefunden!")
      return
    }

    console.log("User gefunden:")
    console.log("- ID:", user.id)
    console.log("- Email:", user.email)
    console.log("- totpEnabled:", user.totpEnabled)
    console.log("- totpSecret vorhanden:", !!user.totpSecret)
    console.log("- totpSecret Länge:", user.totpSecret?.length || 0)
    console.log("- totpSecret (erste 10 Zeichen):", user.totpSecret?.substring(0, 10) || "N/A")
    console.log("- systemRole:", user.systemRole)
    console.log("- isPlatformAdmin:", user.isPlatformAdmin)

    if (!user.totpSecret) {
      console.error("KEIN SECRET GEFUNDEN!")
      return
    }

    console.log("\n=== Generiere aktuellen Code ===")
    const currentCode = authenticator.generate(user.totpSecret)
    console.log("Aktueller Code:", currentCode)

    console.log("\n=== Teste Verifizierung ===")
    const testCode = currentCode
    console.log("Teste Code:", testCode)
    
    // Test 1: Ohne Window
    const isValid1 = authenticator.verify({ token: testCode, secret: user.totpSecret })
    console.log("Verifizierung (ohne window):", isValid1)

    // Test 2: Mit Window 1
    const isValid2 = authenticator.verify({ token: testCode, secret: user.totpSecret, window: 1 })
    console.log("Verifizierung (mit window: 1):", isValid2)

    // Test 3: Mit Window Array
    const isValid3 = authenticator.verify({ token: testCode, secret: user.totpSecret, window: [1, 1] })
    console.log("Verifizierung (mit window: [1,1]):", isValid3)

    // Test 4: Mit Secret.trim()
    const isValid4 = authenticator.verify({ token: testCode, secret: user.totpSecret.trim(), window: 1 })
    console.log("Verifizierung (mit trimmed secret):", isValid4)

    console.log("\n=== Generiere Code für nächste 30 Sekunden ===")
    // Warte einen Moment und generiere neuen Code
    setTimeout(() => {
      const newCode = authenticator.generate(user.totpSecret)
      console.log("Neuer Code (nach 1 Sekunde):", newCode)
      const isValid5 = authenticator.verify({ token: newCode, secret: user.totpSecret, window: 1 })
      console.log("Verifizierung des neuen Codes:", isValid5)
      
      // Prüfe ob alter Code noch gültig ist
      const isValid6 = authenticator.verify({ token: testCode, secret: user.totpSecret, window: 1 })
      console.log("Ist alter Code noch gültig:", isValid6)
      
      prisma.$disconnect()
    }, 1000)

  } catch (error) {
    console.error("Fehler:", error)
    await prisma.$disconnect()
  }
}

debugTotp()


