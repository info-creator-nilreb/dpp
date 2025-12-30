"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import PublicSidebar from "./PublicSidebar"
import PublicHeader from "./PublicMobileHeader"
import { MenuIcon } from "./PublicIcons"

interface PublicLayoutClientProps {
  children: React.ReactNode
}

export default function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  // Hide sidebar on onboarding pages and super-admin routes
  const hideSidebarRoutes = ["/onboarding"]
  const isSuperAdminRoute = pathname?.startsWith("/super-admin")
  const shouldHideSidebar = hideSidebarRoutes.some(route => pathname === route) || isSuperAdminRoute

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileMenuOpen])

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Floating Burger Menu Button - always visible when at top */}
      {!shouldHideSidebar && (
        <>
          <FloatingBurgerButton 
            onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isVisible={!isMobileMenuOpen}
          />
          {/* Sticky Header - appears on scroll up */}
          <PublicHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        </>
      )}

      {/* Sidebar - only show when not on auth pages, always as overlay */}
      {!shouldHideSidebar && (
        <PublicSidebar
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      )}

      {/* Main Content */}
      <main
        style={{
          marginLeft: "0",
          padding: "0",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  )
}

// Floating Burger Button - visible at top of page
function FloatingBurgerButton({ 
  onMenuClick, 
  isVisible 
}: { 
  onMenuClick: () => void
  isVisible: boolean
}) {
  const [showButton, setShowButton] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide floating button when scrolling down or when sticky header appears
      if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setShowButton(false)
      } else if (currentScrollY < 50) {
        // Show button when at top
        setShowButton(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isVisible || !showButton) {
    return null
  }

  return (
    <button
      onClick={onMenuClick}
      style={{
        position: "fixed",
        top: "2rem",
        right: "1.5rem",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E20074",
        borderRadius: "6px",
        padding: "0.75rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#E20074",
        zIndex: 25,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#E20074"
        e.currentTarget.style.color = "#FFFFFF"
        e.currentTarget.style.transform = "scale(1.05)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#FFFFFF"
        e.currentTarget.style.color = "#E20074"
        e.currentTarget.style.transform = "scale(1)"
      }}
      aria-label="Menu öffnen"
    >
      <MenuIcon />
    </button>
  )
}

