import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

/**
 * Onboarding-Helper-Funktionen
 * 
 * Prüft ob User Onboarding benötigt (Platzhalter-Organization-Name)
 */

/**
 * Prüft ob der Organization-Name ein Platzhalter ist
 * 
 * Ein Platzhalter-Name ist:
 * - Der E-Mail-Prefix (z.B. "alexander" bei "alexander@example.com")
 * - Oder der User-Name, wenn dieser beim Signup verwendet wurde
 * 
 * @param organizationName - Name der Organization
 * @param userEmail - E-Mail des Users
 * @param userName - Optional: Name des Users
 * @returns true wenn Platzhalter, sonst false
 */
export function isPlaceholderName(organizationName: string, userEmail: string, userName?: string | null): boolean {
  const emailPrefix = userEmail.split("@")[0]
  
  // Prüfe ob Name = E-Mail-Prefix
  if (organizationName.toLowerCase() === emailPrefix.toLowerCase()) {
    return true
  }
  
  // Prüfe ob Name = User-Name (wenn User-Name beim Signup verwendet wurde)
  if (userName && organizationName.toLowerCase() === userName.toLowerCase()) {
    return true
  }
  
  return false
}

/**
 * Prüft ob User Onboarding benötigt
 * 
 * @returns true wenn Onboarding benötigt wird, sonst false
 */
export async function needsOnboarding(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return false
  }

  try {
    // Hole die erste Organization des Users
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        organization: true
      }
    })

    if (!membership?.organization) {
      return false
    }

    // Prüfe ob Organization-Name ein Platzhalter ist
    return isPlaceholderName(
      membership.organization.name,
      session.user.email,
      session.user.name
    )
  } catch (error) {
    console.error("Error checking onboarding:", error)
    return false
  }
}

/**
 * Prüft Onboarding-Status und leitet um wenn nötig
 * 
 * Diese Funktion wird im App-Layout aufgerufen.
 * Sie prüft, ob der User Onboarding benötigt, und leitet automatisch um.
 * 
 * WICHTIG: Um Endlosschleifen zu vermeiden, wird diese Funktion
 * NICHT aufgerufen, wenn wir bereits auf /app/onboarding sind.
 * Das wird durch das separate Onboarding-Layout sichergestellt,
 * das prüft, ob der User wirklich Onboarding benötigt.
 */
export async function checkOnboarding() {
  // Prüfe ob User Onboarding benötigt
  const needs = await needsOnboarding()
  
  if (needs) {
    // Leite zu Onboarding um
    // Onboarding-Seite ist jetzt außerhalb von /app, damit das App-Layout nicht ausgeführt wird
    redirect("/onboarding")
  }
}

