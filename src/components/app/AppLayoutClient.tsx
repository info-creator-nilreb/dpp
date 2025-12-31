"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import AppSidebar from "./AppSidebar"
import { useSession } from "next-auth/react"
import { useAutoLogout } from "@/hooks/useAutoLogout"

interface AppLayoutClientProps {
  children: React.ReactNode
}

export default function AppLayoutClient({ 
  children
}: AppLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [userLastName, setUserLastName] = useState<string | null>(null)
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([])
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Hide sidebar on login/signup pages and public DPP views
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname?.startsWith("/api/auth")
  const isPublicDppPage = pathname?.startsWith("/public/dpp/")
  const shouldShowSidebar = !isAuthPage && !isPublicDppPage
  
  // Load user role and available features
  useEffect(() => {
    async function loadUserData() {
      try {
        const [profileResponse, featuresResponse] = await Promise.all([
          fetch("/api/app/profile"),
          fetch("/api/app/features")
        ])

        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          setUserRole(profile.user?.role || null)
          setUserFirstName(profile.user?.firstName || null)
          setUserLastName(profile.user?.lastName || null)
        }

        if (featuresResponse.ok) {
          const featuresData = await featuresResponse.json()
          setAvailableFeatures(featuresData.features || [])
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    if (shouldShowSidebar) {
      loadUserData()
    }
  }, [shouldShowSidebar])
  
  // Auto logout after 60 minutes of inactivity (only when logged in)
  useAutoLogout({
    timeout: 60 * 60 * 1000, // 60 minutes
    enabled: shouldShowSidebar,
  })

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
      {/* Sidebar - Desktop (fixed) & Mobile (overlay) - only show when not on auth pages or public DPP views */}
      {shouldShowSidebar && (
        <AppSidebar
          userEmail={session?.user?.email || undefined}
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

