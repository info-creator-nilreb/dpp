import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/**
 * NextAuth.js Konfiguration
 * 
 * Verwendet Credentials Provider für E-Mail/Passwort-Authentifizierung
 * - Passwörter werden mit bcrypt gehasht (10 Runden)
 * - Sessions werden als JWT gespeichert
 * - Login-Seite: /login
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validierung: E-Mail und Passwort müssen vorhanden sein
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // User aus Datenbank laden (inkl. isPlatformAdmin und emailVerified)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            isPlatformAdmin: true,
            emailVerified: true
          }
        })

        if (!user) {
          return null
        }

        // Prüfen ob E-Mail verifiziert ist
        if (!user.emailVerified) {
          // User existiert, aber E-Mail ist nicht verifiziert
          // NextAuth gibt null zurück, was zu "CredentialsSignin" führt
          // Wir können den Fehler im Login-Handler abfangen
          return null
        }

        // Passwort mit bcrypt vergleichen
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // User-Daten für Session zurückgeben (inkl. Platform-Admin-Flag)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isPlatformAdmin: user.isPlatformAdmin || false
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    signOut: "/login"
  },
  callbacks: {
    // Session-Callback: User-ID und Platform-Admin-Flag zur Session hinzufügen
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.isPlatformAdmin = token.isPlatformAdmin as boolean
      }
      return session
    },
    // JWT-Callback: User-ID und Platform-Admin-Flag ins Token schreiben
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.isPlatformAdmin = (user as any).isPlatformAdmin
      }
      return token
    }
  },
  session: {
    strategy: "jwt" // JWT-basierte Sessions (keine DB-Sessions)
  }
})

/**
 * Helper-Funktion für User-Registrierung
 * 
 * Erstellt automatisch:
 * - User-Account
 * - Organization (Name basierend auf User-Name oder E-Mail)
 * - Membership (User wird Mitglied der neuen Organization)
 * 
 * @param email - E-Mail-Adresse des Users
 * @param password - Klartext-Passwort (wird automatisch gehasht)
 * @param name - Optional: Name des Users
 * @returns Erstellter User mit Organization
 */
export async function createUser(email: string, password: string, name?: string) {
  // Passwort mit bcrypt hashen (10 Runden = gute Balance zwischen Sicherheit und Performance)
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Verifizierungs-Token generieren
  const { generateVerificationToken } = await import("@/lib/email")
  const verificationToken = generateVerificationToken()
  const verificationTokenExpires = new Date()
  verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24) // Token gültig für 24 Stunden
  
  // Organization-Name: User-Name oder E-Mail-Prefix
  const organizationName = name || email.split("@")[0]
  
  try {
    // User, Organization und Membership in einer Transaction erstellen
    // Falls ein Schritt fehlschlägt, wird alles zurückgerollt
    const result = await prisma.$transaction(async (tx) => {
      // 1. User erstellen (emailVerified: false, mit Token)
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: false,
          verificationToken,
          verificationTokenExpires
        }
      })
      
      console.log("User created:", user.id)
      
      // 2. Organization erstellen
      const organization = await tx.organization.create({
        data: {
          name: organizationName
        }
      })
      
      console.log("Organization created:", organization.id)
      
      // 3. Membership erstellen (User wird Mitglied der neuen Organization)
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id
        }
      })
      
      console.log("Membership created:", membership.id)
      
      return user
    })
    
    // E-Mail-Verifizierungs-E-Mail senden
    try {
      const { sendVerificationEmail } = await import("@/lib/email")
      await sendVerificationEmail(result.email, result.name, verificationToken)
    } catch (emailError) {
      console.error("Fehler beim Senden der Verifizierungs-E-Mail:", emailError)
      // Fehler wird nicht weitergeworfen, da User bereits erstellt wurde
    }
    
    return result
  } catch (error: any) {
    console.error("Error in createUser - Details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    // Fehler weiterwerfen, damit die Signup-Route ihn behandeln kann
    throw error
  }
}

