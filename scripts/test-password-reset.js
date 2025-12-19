/**
 * Script zum Testen der Passwort-Reset-Funktion
 */

const { requestPasswordReset } = require("../src/lib/password-reset")

async function test() {
  try {
    console.log("Teste Passwort-Reset für berlin.alexander@icloud.com...")
    const result = await requestPasswordReset("berlin.alexander@icloud.com")
    console.log("Ergebnis:", JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log("✅ Passwort-Reset erfolgreich!")
    } else {
      console.log("❌ Passwort-Reset fehlgeschlagen:", result.message)
    }
  } catch (error) {
    console.error("❌ Fehler:", error)
    console.error("Stack:", error.stack)
  }
  process.exit(0)
}

test()

