"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  HomeIcon,
  PricingIcon,
  LoginIcon,
  SignupIcon
} from "./PublicIcons"
import TPassLogo from "./TPassLogo"

const navigationItems = [
  { href: "/", label: "Startseite", icon: HomeIcon },
  { href: "/pricing", label: "Preise", icon: PricingIcon },
]

interface PublicSidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

// Add onMobileClose to SidebarContent props
function SidebarContent({ 
  pathname, 
  isCollapsed = false,
  onToggleCollapse,
  onMobileClose
}: { 
  pathname: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onMobileClose?: () => void
}): JSX.Element

export default function PublicSidebar({ 
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse
}: PublicSidebarProps) {
  const pathname = usePathname()

  // Sidebar is always an overlay (only visible when isMobileOpen is true)
  if (!isMobileOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onMobileClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 40,
        }}
      />
      {/* Sidebar */}
      <nav
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: "280px",
          backgroundColor: "#1E293B",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 50,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "1.5rem 0",
          transition: "transform 0.3s ease",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        <SidebarContent 
          pathname={pathname} 
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
          onMobileClose={onMobileClose}
        />
      </nav>
    </>
  )
}

function SidebarContent({ 
  pathname, 
  isCollapsed = false,
  onToggleCollapse,
  onMobileClose
}: { 
  pathname: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onMobileClose?: () => void
}) {
  return (
    <>
      {/* Logo/Brand */}
      <div style={{ 
        padding: "0 1.5rem 1.5rem", 
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}>
        <TPassLogo size={32} color="#E20074" iconOnly={false} textColor="#FFFFFF" />
      </div>

      {/* Navigation Items */}
      <div style={{ padding: "1.5rem 0" }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "0.75rem",
                padding: "0.75rem 1.5rem",
                color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                backgroundColor: isActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: isActive ? "600" : "400",
                borderLeft: isActive ? "3px solid #E20074" : "3px solid transparent",
                transition: "all 0.15s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"
                  e.currentTarget.style.color = "#FFFFFF"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"
                }
              }}
            >
              <span style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                width: "20px",
                height: "20px",
                flexShrink: 0,
              }}>
                <item.icon />
              </span>
              <span style={{ color: "inherit" }}>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Bottom Section - Auth Links */}
      <div style={{ 
        marginTop: "auto", 
        paddingTop: "2rem", 
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}>
        {/* Login Link */}
        <Link
          href="/login"
          onClick={onMobileClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "0.75rem",
            padding: "0.75rem 0",
            color: "rgba(255, 255, 255, 0.7)",
            textDecoration: "none",
            fontSize: "0.95rem",
            marginBottom: "0.75rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FFFFFF"
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          <span style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "20px",
            height: "20px",
            flexShrink: 0,
          }}>
            <LoginIcon />
          </span>
          <span style={{ color: "inherit" }}>Login</span>
        </Link>

        {/* Signup Button */}
        <Link
          href="/signup"
          onClick={onMobileClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#E20074",
            color: "#FFFFFF",
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: "600",
            borderRadius: "6px",
            width: "auto",
            margin: "0 auto",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#C1005F"
            e.currentTarget.style.transform = "translateY(-1px)"
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(226, 0, 116, 0.3)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#E20074"
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <SignupIcon />
          <span>Jetzt registrieren</span>
        </Link>
      </div>
    </>
  )
}

