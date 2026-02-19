"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import AppSidebar from "./AppSidebar"
import MobileHeader from "./MobileHeader"
import { useSession } from "next-auth/react"
import { useAutoLogout } from "@/hooks/useAutoLogout"
import { useAppData } from "@/contexts/AppDataContext"

/** Stable style so server and client serialize the same (avoids hydration mismatch). */
const WRAPPER_STYLE: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#F5F5F5",
}

interface AppLayoutClientProps {
  children: React.ReactNode
}

export default function AppLayoutClient({ 
  children
}: AppLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { availableFeatures, isLoading: featuresLoading } = useAppData()

  useEffect(() => setMounted(true), [])

  // Hide sidebar on login/signup pages and public DPP views
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname?.startsWith("/api/auth")
  const isPublicDppPage = pathname?.startsWith("/public/dpp/")
  const shouldShowSidebar = !isAuthPage && !isPublicDppPage
  // Erst nach Mount Sidebar/Header rendern, damit Server und Client dieselbe DOM-Struktur haben (vermeidet Hydration-Mismatch)
  const showChrome = mounted && shouldShowSidebar
  // DPP-Editor-Seite (Pflichtdaten/Mehrwert/Vorschau) und Neuer Produktpass: auf Mobile volle Breite ohne grauen Rand
  const isDppEditorPage =
    pathname === "/app/create/new" || pathname?.match(/^\/app\/dpps\/[^/]+$/) != null

  // Auto logout after 60 minutes of inactivity (only when logged in)
  useAutoLogout({
    timeout: 60 * 60 * 1000, // 60 minutes
    enabled: shouldShowSidebar,
  })

  // User data from Session (synchronously available)
  const userEmail = session?.user?.email ?? undefined
  const userFirstName = session?.user?.firstName ?? undefined
  const userLastName = session?.user?.lastName ?? undefined
  const userRole = session?.user?.role ?? undefined

  return (
    <div style={WRAPPER_STYLE}>
      {/* Immer zuerst style + main, damit Server und Client dieselbe Kind-Reihenfolge haben (vermeidet Hydration-Mismatch) */}
      <style
        dangerouslySetInnerHTML={{
          __html: shouldShowSidebar
            ? `
              :root {
                --sidebar-width: ${isSidebarCollapsed ? "64px" : "280px"};
              }
              @media (min-width: 768px) {
                .app-main-content {
                  margin-left: ${isSidebarCollapsed ? "64px" : "280px"} !important;
                  width: calc(100vw - ${isSidebarCollapsed ? "64px" : "280px"}) !important;
                  max-width: calc(100vw - ${isSidebarCollapsed ? "64px" : "280px"}) !important;
                  transition: margin-left 0.3s ease, width 0.3s ease, max-width 0.3s ease;
                }
              }
              @media (max-width: 767px) {
                .app-main-content.dpp-editor-page {
                  padding: 0 !important;
                }
              }
            `
            : "/* no sidebar */",
        }}
      />
      <main
        className={shouldShowSidebar ? "app-main-content" + (isDppEditorPage ? " dpp-editor-page" : "") : ""}
        style={{
          marginLeft: "0",
          paddingLeft: "0",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease, width 0.3s ease, max-width 0.3s ease",
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100vw",
          overflowX: "hidden",
          position: "relative",
          padding: shouldShowSidebar ? "clamp(1rem, 2vw, 2rem)" : "0",
        }}
      >
        {children}
      </main>
      {/* Mobile Header und Sidebar nach main, erst nach Mount (showChrome) */}
      {showChrome && (
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      )}
      {showChrome && !featuresLoading && (
        <AppSidebar
          userEmail={userEmail}
          userRole={userRole}
          userFirstName={userFirstName}
          userLastName={userLastName}
          availableFeatures={availableFeatures}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}
    </div>
  )
}

