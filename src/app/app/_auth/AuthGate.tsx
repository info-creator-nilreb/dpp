import { redirect } from "next/navigation"
import { headers } from "next/headers"

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
  // Dynamischer Import, um Prisma nicht zur Build-Zeit zu laden
  const { auth } = await import("@/auth")
  const session = await auth()

  if (!session) {
    // Prüfe aktuellen Pfad aus headers, um Redirect-Loops zu vermeiden
    const headersList = await headers()
    // Next.js setzt verschiedene Header für den Pfad - probiere mehrere Optionen
    const pathname = headersList.get("x-pathname") || 
                     headersList.get("x-invoke-path") || 
                     headersList.get("referer")?.match(/https?:\/\/[^\/]+(\/[^?#]*)/)?.[1] || 
                     ""
    
    // Wenn wir bereits auf einer öffentlichen Route sind, keine Weiterleitung
    // Dies verhindert Redirect-Loops, falls AuthGate versehentlich auf öffentlichen Routen verwendet wird
    const publicRoutes = ["/login", "/signup", "/onboarding"]
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.endsWith(route))
    
    // Nur redirecten, wenn wir NICHT bereits auf einer öffentlichen Route sind
    // Wenn wir bereits auf einer öffentlichen Route sind, einfach children rendern (verhindert Loop)
    if (!isPublicRoute) {
      redirect("/login")
    }
    
    // Wenn wir bereits auf einer öffentlichen Route sind, einfach children rendern
    // (Dies sollte eigentlich nie passieren, da AuthGate nur in /app/** verwendet wird,
    // aber als Sicherheit gegen Redirect-Loops)
    return <>{children}</>
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

