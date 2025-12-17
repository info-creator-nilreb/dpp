import { redirect } from "next/navigation"

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

  // Prüfe ob Onboarding benötigt wird via API route (Prisma not in render path)
  // Use relative URL - Next.js fetch automatically forwards cookies for same-origin requests
  let needsOnboarding = false
  
  try {
    const response = await fetch("/api/app/onboarding/check", {
      cache: "no-store",
    })

    if (response.ok) {
      const data = await response.json()
      needsOnboarding = data.needsOnboarding === true
    }
  } catch (error) {
    // Bei Network-Fehler: Onboarding-Check überspringen (nur loggen, nicht abbrechen)
    console.error("Error checking onboarding (network error):", error)
    // Bei Fehler: Onboarding-Check überspringen, Seite normal rendern
  }

  // redirect() muss AUSSERHALB von try/catch sein
  // redirect() wirft NEXT_REDIRECT - darf NICHT gefangen werden
  if (needsOnboarding) {
    redirect("/onboarding")
  }

  // User ist authentifiziert und hat Onboarding abgeschlossen
  return <>{children}</>
}

