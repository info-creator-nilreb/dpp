"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"
import MobileHeader from "./MobileHeader"
import { useAutoLogout } from "@/hooks/useAutoLogout"

interface LayoutClientProps {
  children: React.ReactNode
  userEmail?: string
  userRole?: string
  userName?: string
}

export default function LayoutClient({ 
  children, 
  userEmail, 
  userRole, 
  userName 
}: LayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  
  // Hide sidebar on login page
  const isLoginPage = pathname === "/super-admin/login"
  
  // Auto logout after 60 minutes of inactivity (only when logged in)
  useAutoLogout({
    timeout: 60 * 60 * 1000, // 60 minutes
    enabled: !isLoginPage,
  })

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
      {/* Mobile Header - only show when not on login page */}
      {!isLoginPage && (
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      )}

      {/* Sidebar - Desktop (fixed) & Mobile (overlay) - only show when not on login page */}
      {!isLoginPage && (
        <Sidebar
          userEmail={userEmail || userName}
          userRole={userRole}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}


      {/* Main Content */}
      <>
        {!isLoginPage && (
          <style dangerouslySetInnerHTML={{
            __html: `
              @media (min-width: 768px) {
                .super-admin-main-content {
                  margin-left: ${isSidebarCollapsed ? "64px" : "280px"} !important;
                  transition: margin-left 0.3s ease;
                }
              }
            `
          }} />
        )}
        <main
          className={!isLoginPage ? "super-admin-main-content" : ""}
          style={{
            marginLeft: isLoginPage ? "0" : "0",
            paddingLeft: "0",
            minHeight: "100vh",
            transition: "margin-left 0.3s ease",
            boxSizing: "border-box",
            width: "100%",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </>
    </div>
  )
}
