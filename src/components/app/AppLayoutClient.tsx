"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import AppSidebar from "./AppSidebar"
import MobileHeader from "./MobileHeader"
import { useSession } from "next-auth/react"
import { useAutoLogout } from "@/hooks/useAutoLogout"
import { useAppData } from "@/contexts/AppDataContext"

/** Stable wrapper style – gleiches Element (main) auf Server und Client verhindert Hydration-Mismatch. */
const WRAPPER_STYLE: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#F5F5F5",
  marginLeft: "0",
  paddingLeft: "0",
  boxSizing: "border-box",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  position: "relative",
  transition: "margin-left 0.3s ease, width 0.3s ease, max-width 0.3s ease",
}

/** Default style content – identisch bei SSR und erstem Client-Render (vermeidet Hydration-Mismatch). */
const DEFAULT_STYLE = "/* hydrated */"

interface AppLayoutClientProps {
  children: React.ReactNode
}

export default function AppLayoutClient({ 
  children
}: AppLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [styleContent, setStyleContent] = useState(DEFAULT_STYLE)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { availableFeatures, isLoading: featuresLoading } = useAppData()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const show = !pathname?.startsWith("/login") && !pathname?.startsWith("/signup") && !pathname?.startsWith("/api/auth") && !pathname?.startsWith("/public/dpp/")
    setStyleContent(
      show
        ? `:root{--sidebar-width:${isSidebarCollapsed?"64px":"280px"}}@media(min-width:768px){.app-main-content{margin-left:${isSidebarCollapsed?"64px":"280px"}!important;width:calc(100vw - ${isSidebarCollapsed?"64px":"280px"})!important;max-width:calc(100vw - ${isSidebarCollapsed?"64px":"280px"})!important;transition:margin-left .3s ease,width .3s ease,max-width .3s ease}}@media(max-width:767px){.app-main-content{padding-top:calc(88px + env(safe-area-inset-top,0))!important}.app-main-content.dpp-editor-page{padding:0!important;padding-top:calc(88px + env(safe-area-inset-top,0))!important}}`
        : "/* no sidebar */"
    )
  }, [mounted, pathname, isSidebarCollapsed])

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

  // Ein einziges <main> als Wrapper – gleiche Struktur auf Server und Client (vermeidet Hydration-Mismatch)
  const contentPadding = shouldShowSidebar ? "clamp(1rem, 2vw, 2rem)" : "0"
  return (
    <main
      className={shouldShowSidebar ? "app-main-content" + (isDppEditorPage ? " dpp-editor-page" : "") : ""}
      style={{
        ...WRAPPER_STYLE,
        padding: contentPadding,
      }}
      suppressHydrationWarning
    >
      {mounted && (
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />
      )}
      {children}
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
    </main>
  )
}

