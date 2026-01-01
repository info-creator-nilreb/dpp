"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useMemo } from "react"
import { signOut } from "next-auth/react"
import TPassLogo from "@/app/super-admin/components/TPassLogo"
import { AuditLogsIcon } from "@/app/super-admin/components/Icons"

interface NavigationItem {
  href: string
  label: string
  icon: React.ReactNode
  featureKey?: string // Optional feature key to check availability
  requiredRoles?: string[] // Optional roles required to enable item (e.g., ["ORG_ADMIN", "ORG_OWNER"])
}

interface AppSidebarProps {
  userEmail?: string
  userRole?: string | null
  userFirstName?: string | null
  userLastName?: string | null
  availableFeatures?: string[]
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function AppSidebar({ 
  userEmail, 
  userRole,
  userFirstName,
  userLastName,
  availableFeatures = [],
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse
}: AppSidebarProps) {
  const pathname = usePathname()

  // Define navigation items - ALL items are always visible, disabled-state is computed
  const navigationItems: NavigationItem[] = [
    {
      href: "/app/dashboard",
      label: "Dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: "/app/create",
      label: "Produktpass erstellen",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
    },
    {
      href: "/app/dpps",
      label: "Produktpässe verwalten",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
    },
    {
      href: "/app/organization",
      label: "Organisation",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      requiredRoles: ["ORG_ADMIN", "ORG_OWNER"],
    },
    {
      href: "/app/account",
      label: "Meine Daten",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: "/app/audit-logs",
      label: "Audit Logs",
      icon: <AuditLogsIcon />,
      featureKey: "audit_logs",
    },
  ]

  // Check if item is visible (user has permission to see it)
  // Use useMemo to ensure stable calculation - prevents sidebar from changing after initial render
  const visibleNavigationItems = useMemo(() => {
    return navigationItems.filter((item) => {
      // Check required roles
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        if (!userRole || !item.requiredRoles.includes(userRole)) {
          return false
        }
      }
      // Check feature availability
      if (item.featureKey && !availableFeatures.includes(item.featureKey)) {
        return false
      }
      return true
    })
  }, [userRole, availableFeatures])

  // Mobile overlay
  if (isMobileOpen) {
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
            width: isCollapsed ? "64px" : "280px",
            backgroundColor: "#1E293B",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            zIndex: 50,
            overflowY: "auto",
            overflowX: "hidden",
            padding: isCollapsed ? "1rem 0" : "1.5rem 0",
            transition: "width 0.3s ease, padding 0.3s ease",
          }}
        >
        <SidebarContent 
          pathname={pathname} 
          userEmail={userEmail} 
          userRole={userRole}
          userFirstName={userFirstName}
          userLastName={userLastName}
          isCollapsed={isCollapsed}
          navigationItems={visibleNavigationItems}
          onToggleCollapse={onToggleCollapse}
        />
        </nav>
      </>
    )
  }

  // Desktop sidebar (always visible on desktop, can be collapsed)
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 767px) {
            .app-sidebar-desktop {
              display: none !important;
            }
          }
          @media (min-width: 768px) {
            .app-sidebar-desktop {
              display: block !important;
            }
          }
        `
      }} />
      <nav
        className="app-sidebar-desktop"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: isCollapsed ? "64px" : "280px",
          backgroundColor: "#1E293B",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isCollapsed ? "1rem 0" : "1.5rem 0",
          zIndex: 20,
          transition: "width 0.3s ease, padding 0.3s ease",
        }}
      >
        <SidebarContent 
          pathname={pathname} 
          userEmail={userEmail} 
          userRole={userRole}
          userFirstName={userFirstName}
          userLastName={userLastName}
          isCollapsed={isCollapsed}
          navigationItems={visibleNavigationItems}
          onToggleCollapse={onToggleCollapse}
        />
      </nav>
    </>
  )
}

function SidebarContent({ 
  pathname, 
  userEmail, 
  userRole,
  userFirstName,
  userLastName,
  isCollapsed = false,
  navigationItems,
  onToggleCollapse,
}: { 
  pathname: string
  userEmail?: string
  userRole?: string | null
  userFirstName?: string | null
  userLastName?: string | null
  isCollapsed?: boolean
  navigationItems: NavigationItem[]
  onToggleCollapse?: () => void
}) {
  // Get initial from last name, fallback to first name, then email
  const getInitial = () => {
    if (userLastName) {
      return userLastName.charAt(0).toUpperCase()
    }
    if (userFirstName) {
      return userFirstName.charAt(0).toUpperCase()
    }
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase()
    }
    return "A"
  }

  // Get display name
  const getDisplayName = () => {
    if (userFirstName && userLastName) {
      return `${userFirstName} ${userLastName}`
    }
    if (userFirstName) {
      return userFirstName
    }
    if (userEmail) {
      return userEmail.split("@")[0]
    }
    return "Benutzer"
  }
  return (
    <>
      {/* Logo/Brand */}
      <div style={{ 
        padding: isCollapsed ? "1rem 0.5rem 1.5rem" : "0 1.5rem 1.5rem", 
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: isCollapsed ? "center" : "flex-start",
      }}>
        {isCollapsed ? (
          <TPassLogo size={32} color="#E20074" iconOnly={true} />
        ) : (
          <TPassLogo size={32} color="#E20074" iconOnly={false} textColor="#FFFFFF" />
        )}
      </div>

      {/* Navigation Items - Only visible items are shown */}
      <div style={{ padding: isCollapsed ? "1rem 0" : "1.5rem 0" }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: "0.75rem",
                padding: isCollapsed ? "0.75rem" : "0.75rem 1.5rem",
                color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                backgroundColor: isActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: isActive ? "600" : "400",
                borderLeft: isActive && !isCollapsed ? "3px solid #E20074" : "3px solid transparent",
                transition: "all 0.15s ease",
                position: "relative",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"
                  e.currentTarget.style.color = "#FFFFFF"
                }
                // Tooltip when collapsed
                if (isCollapsed) {
                  const tooltip = document.createElement("div")
                  tooltip.textContent = item.label
                  tooltip.style.cssText = `
                    position: absolute;
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    margin-left: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    backgroundColor: #0A0A0A;
                    color: #FFFFFF;
                    fontSize: 0.875rem;
                    borderRadius: 4px;
                    whiteSpace: nowrap;
                    zIndex: 1000;
                    pointerEvents: none;
                    boxShadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                  `
                  tooltip.className = "sidebar-tooltip"
                  e.currentTarget.style.position = "relative"
                  e.currentTarget.appendChild(tooltip)
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"
                }
                // Remove tooltip
                const tooltip = e.currentTarget.querySelector(".sidebar-tooltip")
                if (tooltip) {
                  tooltip.remove()
                }
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <span style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                width: "20px",
                height: "20px",
                flexShrink: 0,
              }}>
                {item.icon}
              </span>
              {!isCollapsed && <span style={{ color: "inherit" }}>{item.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Bottom Section - User Info & Logout */}
      <div style={{ 
        marginTop: "auto", 
        padding: isCollapsed ? "1rem 0" : "1.5rem",
      }}>
        {/* User Info (Shopware-style) - Always render if session is available, even without full profile data */}
        {userEmail && (
          <div style={{ 
            marginTop: "0.5rem", 
            paddingTop: "0.75rem", 
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "0.75rem",
            padding: isCollapsed ? "0.75rem 0 0 0" : "0.75rem 0 0 0",
          }}>
            {/* Avatar */}
            <div style={{
              width: isCollapsed ? "32px" : "40px",
              height: isCollapsed ? "32px" : "40px",
              borderRadius: "50%",
              backgroundColor: "#E20074",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: isCollapsed ? "0.75rem" : "0.875rem",
              fontWeight: "600",
              flexShrink: 0,
            }}>
              {getInitial()}
            </div>
            {!isCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ 
                  fontSize: "0.875rem", 
                  color: "#FFFFFF", 
                  margin: 0,
                  fontWeight: "500",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {getDisplayName()}
                </p>
                {userRole && (
                  <p style={{ 
                    fontSize: "0.75rem", 
                    color: "#E20074",
                    margin: "0.25rem 0 0 0",
                    textTransform: "capitalize",
                  }}>
                    {userRole.replace("_", " ")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={async () => {
              try {
                // Use NextAuth signOut (without redirect, then manual redirect)
                await signOut({ redirect: false })
                // Always redirect to login
                window.location.href = "/login"
              } catch (error) {
                console.error("Error during logout:", error)
                // Even on error, redirect to login
                window.location.href = "/login"
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "0.75rem",
              padding: "0.75rem 0",
              color: "rgba(255, 255, 255, 0.7)",
              backgroundColor: "transparent",
              border: "none",
              fontSize: "0.95rem",
              cursor: "pointer",
              width: "100%",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"
              e.currentTarget.style.color = "#FFFFFF"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Abmelden</span>
          </button>
        )}

        {/* Toggle Button */}
        {onToggleCollapse && (
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
            }}
          >
            <button
              onClick={onToggleCollapse}
              style={{
                backgroundColor: "transparent",
                border: "none",
                padding: "0.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255, 255, 255, 0.7)",
                width: isCollapsed ? "100%" : "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FFFFFF"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"
              }}
              aria-label={isCollapsed ? "Menü ausklappen" : "Menü einklappen"}
              className="hidden md:flex"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

