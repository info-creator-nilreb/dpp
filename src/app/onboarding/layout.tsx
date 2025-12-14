import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * Onboarding-Layout
 * 
 * Separates Layout für die Onboarding-Seite.
 * 
 * WICHTIG: In Next.js App Router werden Layouts verschachtelt.
 * Das bedeutet, dass das App-Layout (parent) immer noch ausgeführt wird.
 * 
 * Um Endlosschleifen zu vermeiden, prüfen wir hier, ob der User
 * wirklich Onboarding benötigt. Wenn nicht, leiten wir zum Dashboard um.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Prüfe ob User wirklich Onboarding benötigt
  // Wenn nicht (z.B. Name wurde bereits geändert), leite zum Dashboard um
  // WICHTIG: Diese Prüfung verhindert, dass User ohne Onboarding-Bedarf hier landen
  const { needsOnboarding } = await import("@/lib/onboarding")
  const needs = await needsOnboarding()
  
  if (!needs) {
    // User benötigt kein Onboarding mehr → zum Dashboard
    redirect("/app/dashboard")
  }
  
  // User benötigt Onboarding → Seite anzeigen
  // Das App-Layout wird trotzdem ausgeführt, aber redirect() stoppt das Rendering
  // Daher rendern wir hier direkt, ohne auf das App-Layout zu warten

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#F5F5F5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {/* Minimales Layout ohne Navigation */}
      <div style={{ 
        width: "100%",
        maxWidth: "600px",
        padding: "clamp(1rem, 3vw, 2rem)"
      }}>
        {children}
      </div>
    </div>
  )
}

