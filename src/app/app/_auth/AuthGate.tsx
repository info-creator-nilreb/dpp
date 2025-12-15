import { auth } from "@/auth"
import { redirect } from "next/navigation"

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

  // Prüfe ob Onboarding benötigt wird via API route (Prisma not in render path)
  // Use relative URL - Next.js fetch automatically forwards cookies for same-origin requests
  try {
    const response = await fetch("/api/app/onboarding/check", {
      cache: "no-store",
    })

    if (response.ok) {
      const data = await response.json()
      if (data.needsOnboarding) {
        redirect("/onboarding")
      }
    }
  } catch (error) {
    // Bei Fehler: Onboarding-Check überspringen
    console.error("Error checking onboarding:", error)
  }

  // User ist authentifiziert und hat Onboarding abgeschlossen
  return <>{children}</>
}

