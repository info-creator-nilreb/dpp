/**
 * Test-Script für TOTP-Verifizierung
 * 
 * Testet ob die TOTP-Verifizierung korrekt funktioniert
 */

const { authenticator } = require("otplib")

// Test 1: Generiere Secret und Code
console.log("=== Test 1: Secret generieren und Code erstellen ===")
const secret = authenticator.generateSecret()
console.log("Secret:", secret)

// Test 2: Generiere Token
const token = authenticator.generate(secret)
console.log("Generierter Token:", token)

// Test 3: Verifiziere ohne Window
console.log("\n=== Test 2: Verifizierung ohne Window ===")
const isValid1 = authenticator.verify({ token, secret })
console.log("Ergebnis (ohne window):", isValid1)

// Test 4: Verifiziere mit Window
console.log("\n=== Test 3: Verifizierung mit Window [1,1] ===")
const isValid2 = authenticator.verify({ token, secret, window: [1, 1] })
console.log("Ergebnis (mit window [1,1]):", isValid2)

// Test 5: Teste mit String-Window (falls das das Problem ist)
console.log("\n=== Test 4: Verifizierung mit window: 1 (Number) ===")
try {
  const isValid3 = authenticator.verify({ token, secret, window: 1 })
  console.log("Ergebnis (mit window: 1):", isValid3)
} catch (error) {
  console.error("Fehler mit window: 1:", error.message)
}

// Test 6: Teste mit getter für aktuellen Code
console.log("\n=== Test 5: Aktueller Code vom Server ===")
const currentToken = authenticator.generate(secret)
console.log("Aktueller Code (sollte gleich sein wie oben):", currentToken)
const isValid4 = authenticator.verify({ token: currentToken, secret, window: [1, 1] })
console.log("Verifizierung des aktuellen Codes:", isValid4)


