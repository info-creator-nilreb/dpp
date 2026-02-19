import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * AuthGate - Server Component
 *
 * Handles authentication and onboarding checks for protected pages.
 * MUST be used in pages, NOT in layouts.
 *
 * WICHTIG: AuthGate wird ausschließlich in /app/** Seiten verwendet.
 * Die Middleware leitet bereits nicht-authentifizierte Requests zu /login um.
 */
export default async function AuthGate({
  children,
}: {
  children: React.ReactNode
}) {
  // Login wird bereits durch middleware.ts garantiert
  // AuthGate prüft NUR Business-Logik (Onboarding)
  // Direkte Prisma-Abfrage statt Self-Fetch (vermeidet "fetch failed" in SSR/Turbopack)
  let needsOnboarding = false

  try {
    const session = await auth()
    if (session?.user?.id) {
      const count = await prisma.membership.count({
        where: { userId: session.user.id },
      })
      needsOnboarding = count === 0
    }
  } catch (error) {
    // Bei Pool-Timeout oder anderen DB-Fehlern: nicht zu Onboarding umleiten, App weiter nutzbar
    console.error("Error checking onboarding (continuing without redirect):", error)
    needsOnboarding = false
  }

  if (needsOnboarding) {
    redirect("/onboarding")
  }

  return <>{children}</>
}

