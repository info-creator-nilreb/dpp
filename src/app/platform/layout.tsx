export const dynamic = "force-dynamic"

import { requirePlatformAdmin } from "@/lib/access"
import { signOut } from "@/auth"
import Link from "next/link"

/**
 * Platform-Layout
 * 
 * Geschützter Bereich nur für Platform-Admin
 * - Prüft Platform-Admin-Zugriff
 * - Zeigt Navigation
 * - Logout-Funktion
 */
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Prüft Platform-Admin-Zugriff (leitet um wenn nicht autorisiert)
  await requirePlatformAdmin()

  return (
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
            <Link href="/platform" style={{
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
              T-Pass Platform
            </Link>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/platform" style={{
                color: "#0A0A0A",
                textDecoration: "none",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "500"
              }}>
                Übersicht
              </Link>
              <Link href="/app/dashboard" style={{
                color: "#7A7A7A",
                textDecoration: "none",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "500"
              }}>
                Zur App
              </Link>
            </div>
          </div>
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
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        {children}
      </main>
    </div>
  )
}

