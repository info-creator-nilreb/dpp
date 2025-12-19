import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "./email"

/**
 * Generiert einen sicheren Reset-Token
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Sendet einen Passwort-Reset-Link an die E-Mail-Adresse
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log("requestPasswordReset: Suche User mit E-Mail:", email)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordResetToken: true,
        passwordResetTokenExpires: true,
      },
    })

    // Aus Sicherheitsgründen geben wir keine Auskunft, ob die E-Mail existiert
    if (!user) {
      console.log("requestPasswordReset: User nicht gefunden")
      return {
        success: true,
        message: "Wenn diese E-Mail-Adresse existiert, wurde ein Reset-Link gesendet.",
      }
    }

    console.log("requestPasswordReset: User gefunden, ID:", user.id)

    // Generiere Reset-Token
    const resetToken = generatePasswordResetToken()
    const resetTokenExpires = new Date()
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1) // Token gültig für 1 Stunde
    console.log("requestPasswordReset: Token generiert, läuft ab:", resetTokenExpires)

    // Speichere Token in DB
    // WICHTIG: Lösche zuerst alle alten, abgelaufenen Reset-Tokens, um Unique-Constraint-Fehler zu vermeiden
    try {
      console.log("requestPasswordReset: Speichere Token in DB...")
      
      // Prüfe ob ein alter Token vorhanden ist und lösche ihn falls abgelaufen
      if (user.passwordResetToken) {
        const existingTokenExpires = user.passwordResetTokenExpires
        if (existingTokenExpires && existingTokenExpires < new Date()) {
          console.log("requestPasswordReset: Lösche abgelaufenen alten Token")
        }
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetTokenExpires: resetTokenExpires,
        },
      })
      console.log("requestPasswordReset: Token erfolgreich gespeichert")
    } catch (dbError: any) {
      console.error("requestPasswordReset: Fehler beim Speichern des Reset-Tokens:", dbError)
      console.error("requestPasswordReset: DB Error Code:", dbError?.code)
      console.error("requestPasswordReset: DB Error Meta:", JSON.stringify(dbError?.meta, null, 2))
      console.error("requestPasswordReset: DB Error Message:", dbError?.message)
      
      // Wenn es ein Unique-Constraint-Fehler ist, versuche es nochmal mit null-Werten
      if (dbError?.code === "P2002" && dbError?.meta?.target?.includes("passwordResetToken")) {
        console.log("requestPasswordReset: Unique-Constraint-Fehler erkannt, setze Token auf null und versuche erneut...")
        try {
          // Setze Token auf null und versuche es erneut
          await prisma.user.update({
            where: { id: user.id },
            data: {
              passwordResetToken: null,
              passwordResetTokenExpires: null,
            },
          })
          
          // Jetzt versuche es nochmal
          await prisma.user.update({
            where: { id: user.id },
            data: {
              passwordResetToken: resetToken,
              passwordResetTokenExpires: resetTokenExpires,
            },
          })
          console.log("requestPasswordReset: Token erfolgreich gespeichert (nach Retry)")
        } catch (retryError: any) {
          console.error("requestPasswordReset: Retry fehlgeschlagen:", retryError)
          throw retryError
        }
      } else {
        throw dbError // Fehler weiterwerfen, damit er oben abgefangen wird
      }
    }

    // Sende E-Mail (wird im Development-Mode nur geloggt)
    try {
      console.log("requestPasswordReset: Sende E-Mail...")
      await sendPasswordResetEmail(user.email, user.name, resetToken)
      console.log("requestPasswordReset: E-Mail gesendet")
    } catch (emailError) {
      console.error("requestPasswordReset: Fehler beim Senden der E-Mail (nicht kritisch):", emailError)
      // E-Mail-Fehler ist nicht kritisch - Token wurde bereits gespeichert
      // Im Development-Mode sollte dies nicht auftreten
    }

    console.log("requestPasswordReset: Erfolgreich abgeschlossen")
    return {
      success: true,
      message: "Wenn diese E-Mail-Adresse existiert, wurde ein Reset-Link gesendet.",
    }
  } catch (error: any) {
    console.error("requestPasswordReset: FEHLER in catch-Klausel:", error)
    console.error("requestPasswordReset: Error type:", typeof error)
    console.error("requestPasswordReset: Error message:", error?.message)
    console.error("requestPasswordReset: Error code:", error?.code)
    console.error("requestPasswordReset: Error stack:", error?.stack)
    return {
      success: false,
      message: error?.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    }
  }
}

/**
 * Setzt das Passwort mit einem Reset-Token zurück
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetTokenExpires: {
          gt: new Date(), // Token muss noch gültig sein
        },
      },
    })

    if (!user) {
      return {
        success: false,
        message: "Ungültiger oder abgelaufener Reset-Token.",
      }
    }

    // Passwort hashen
    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Passwort aktualisieren und Token löschen
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetTokenExpires: null,
        },
      })
    } catch (dbError) {
      console.error("Fehler beim Aktualisieren des Passworts:", dbError)
      throw dbError
    }

    return {
      success: true,
      message: "Passwort wurde erfolgreich zurückgesetzt.",
    }
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error)
    console.error("Error details:", error instanceof Error ? error.message : error)
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A")
    return {
      success: false,
      message: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    }
  }
}

