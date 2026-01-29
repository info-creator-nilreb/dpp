"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import AppSidebar from "./AppSidebar"
import MobileHeader from "./MobileHeader"
import { useSession } from "next-auth/react"
import { useAutoLogout } from "@/hooks/useAutoLogout"
import { useAppData } from "@/contexts/AppDataContext"

interface AppLayoutClientProps {
  children: React.ReactNode
}

export default function AppLayoutClient({ 
  children
}: AppLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { availableFeatures, isLoading: featuresLoading } = useAppData()
  
  // Hide sidebar on login/signup pages and public DPP views
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname?.startsWith("/api/auth")
  const isPublicDppPage = pathname?.startsWith("/public/dpp/")
  const shouldShowSidebar = !isAuthPage && !isPublicDppPage
  
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
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
      {/* Mobile Header - only show when not on auth pages or public DPP views */}
      {shouldShowSidebar && (
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      )}

      {/* Sidebar - Desktop (fixed) & Mobile (overlay) - only show when not on auth pages or public DPP views */}
      {/* Only render sidebar when features are loaded to prevent layout shifts */}
      {shouldShowSidebar && !featuresLoading && (
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

      {/* Main Content */}
      <>
        {shouldShowSidebar && (
          <style dangerouslySetInnerHTML={{
            __html: `
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
            `
          }} />
        )}
        <main
          className={shouldShowSidebar ? "app-main-content" : ""}
          style={{
            marginLeft: shouldShowSidebar ? "0" : "0",
            paddingLeft: "0",
            minHeight: "100vh",
            transition: "margin-left 0.3s ease, width 0.3s ease, max-width 0.3s ease",
            boxSizing: "border-box",
            width: shouldShowSidebar ? "100%" : "100%",
            maxWidth: shouldShowSidebar ? "100vw" : "100vw",
            overflowX: "hidden",
            position: "relative",
            padding: shouldShowSidebar ? "clamp(1rem, 2vw, 2rem)" : "0",
          }}
        >
          {children}
        </main>
      </>
    </div>
  )
}

