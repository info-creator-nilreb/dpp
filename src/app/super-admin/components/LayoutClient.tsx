"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"
import MobileHeader from "./MobileHeader"

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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      {/* Sidebar - Desktop (fixed) & Mobile (overlay) */}
      <Sidebar
        userEmail={userEmail || userName}
        userRole={userRole}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />


      {/* Main Content */}
      <>
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
        <main
          className="super-admin-main-content"
          style={{
            marginLeft: "0",
            paddingLeft: "0",
            minHeight: "100vh",
            transition: "margin-left 0.3s ease",
          }}
        >
          {children}
        </main>
      </>
    </div>
  )
}
