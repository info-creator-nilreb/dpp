import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/auth"
import { getUserOrganizations } from "@/lib/access"
import { needsOnboarding } from "@/lib/onboarding"
import Link from "next/link"
import { headers } from "next/headers"
import { NotificationProvider } from "@/components/NotificationProvider"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Prüfe ob Onboarding benötigt wird
  // WICHTIG: Diese Prüfung erfolgt im App-Layout (Server Component)
  // und leitet automatisch zu /onboarding um, wenn Platzhalter-Name erkannt wird
  // 
  // Prüfe Onboarding-Status (mit Fehlerbehandlung)
  let needsOnboardingCheck = false
  try {
    needsOnboardingCheck = await needsOnboarding()
  } catch (error) {
    console.error("Error checking onboarding:", error)
    // Bei Fehler: Onboarding-Check überspringen
  }
  
  if (needsOnboardingCheck) {
    redirect("/onboarding")
  }

  // Lade Organizations des Users (mit Fehlerbehandlung)
  let organizations = []
  try {
    organizations = await getUserOrganizations()
  } catch (error) {
    console.error("Error loading organizations:", error)
    // Bei Fehler: Leeres Array verwenden
  }

  return (
    <NotificationProvider>
      <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
        {/* Navigation */}
        <nav style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #CDCDCD",
        padding: "clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem)"
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(1rem, 3vw, 2rem)", flexWrap: "wrap" }}>
            <Link href="/" style={{
              fontSize: "clamp(1rem, 3vw, 1.25rem)",
              fontWeight: "700",
              color: "#0A0A0A",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="#E20074"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  style={{ width: "100%", height: "100%" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              T-Pass
            </Link>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/app/dashboard" style={{
                color: "#0A0A0A",
                textDecoration: "none",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "500"
              }}>
                Dashboard
              </Link>
              {session.user?.isPlatformAdmin && (
                <Link href="/platform" style={{
                  color: "#7A7A7A",
                  textDecoration: "none",
                  fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                  fontWeight: "500"
                }}>
                  Platform
                </Link>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {organizations.length > 0 && (
              <span style={{ color: "#7A7A7A", fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
                {organizations[0].name}
              </span>
            )}
            <span style={{ color: "#7A7A7A", fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
              {session.user?.email}
            </span>
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <button type="submit" style={{
                padding: "clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)",
                backgroundColor: "transparent",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                color: "#0A0A0A",
                cursor: "pointer",
                fontSize: "clamp(0.8rem, 2vw, 0.9rem)"
              }}>
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </nav>

        {/* Main Content */}
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
          {children}
        </main>
      </div>
    </NotificationProvider>
  )
}

