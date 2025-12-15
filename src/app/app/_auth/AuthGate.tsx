import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { needsOnboarding } from "@/lib/onboarding"

/**
 * AuthGate - Server Component
 * 
 * Handles authentication and onboarding checks for protected pages.
 * MUST be used in pages, NOT in layouts.
 */
export default async function AuthGate({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Prüfe ob Onboarding benötigt wird
  const needsOnboardingCheck = await needsOnboarding()
  
  if (needsOnboardingCheck) {
    redirect("/onboarding")
  }

  // User ist authentifiziert und hat Onboarding abgeschlossen
  return <>{children}</>
}

