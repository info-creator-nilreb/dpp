/**
 * User-Registrierung (ausgelagert aus auth.ts)
 *
 * Wird nur von API-Routen (z. B. signup) verwendet.
 * Nicht in auth.ts belassen, damit Middleware auth.ts laden kann ohne
 * @/lib/email (und damit Node crypto) in die Edge Runtime zu ziehen.
 */

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/**
 * Erstellt User-Account, Organization und Membership; sendet Verifizierungs-Mail.
 */
export async function createUser(email: string, password: string, name?: string) {
  const hashedPassword = await bcrypt.hash(password, 10)

  const { generateVerificationToken } = await import("@/lib/email")
  const verificationToken = generateVerificationToken()
  const verificationTokenExpires = new Date()
  verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24)

  const organizationName = name || email.split("@")[0]

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: false,
          verificationToken,
          verificationTokenExpires,
        },
      })

      const organization = await tx.organization.create({
        data: { name: organizationName },
      })

      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ORG_ADMIN",
        },
      })

      return user
    })

    try {
      const { sendVerificationEmail } = await import("@/lib/email")
      await sendVerificationEmail(result.email, result.name, verificationToken)
    } catch (emailError) {
      console.error("Fehler beim Senden der Verifizierungs-E-Mail:", emailError)
    }

    return result
  } catch (error: unknown) {
    console.error("Error in createUser - Details:", error)
    throw error
  }
}
