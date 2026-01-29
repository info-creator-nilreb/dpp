"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { 
  DashboardIcon, 
  OrganizationsIcon, 
  DppsIcon, 
  TemplatesIcon, 
  UsersIcon, 
  AuditLogsIcon,
  SettingsIcon,
  LogoutIcon,
  FeatureRegistryIcon,
  PricingIcon
} from "./Icons"
import TPassLogo from "./TPassLogo"
import { apiFetch } from "@/lib/api-client"

const navigationItems = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/super-admin/organizations", label: "Organisationen", icon: OrganizationsIcon },
  { href: "/super-admin/users", label: "Benutzer", icon: UsersIcon },
  { href: "/super-admin/dpps", label: "DPPs", icon: DppsIcon },
  { href: "/super-admin/templates", label: "Templates", icon: TemplatesIcon },
  { href: "/super-admin/feature-registry", label: "Funktionen", icon: FeatureRegistryIcon },
  { href: "/super-admin/pricing", label: "Preise & Abos", icon: PricingIcon },
  { href: "/super-admin/audit-logs", label: "Audit Logs", icon: AuditLogsIcon },
]

interface SidebarProps {
  userEmail?: string
  userRole?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ 
  userEmail, 
  userRole, 
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname()

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
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            onMobileClose={onMobileClose}
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
            .super-admin-sidebar-desktop {
              display: none !important;
            }
          }
          @media (min-width: 768px) {
            .super-admin-sidebar-desktop {
              display: block !important;
            }
          }
        `
      }} />
      <nav
        className="super-admin-sidebar-desktop"
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
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          onMobileClose={undefined}
        />
      </nav>
    </>
  )
}

function SidebarContent({ 
  pathname, 
  userEmail, 
  userRole,
  isCollapsed = false,
  onToggleCollapse,
  onMobileClose
}: { 
  pathname: string
  userEmail?: string
  userRole?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onMobileClose?: () => void
}) {
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
          <TPassLogo size={32} color="#24c598" iconOnly={true} />
        ) : (
          <>
            <TPassLogo size={32} color="#24c598" iconOnly={false} textColor="#FFFFFF" />
            <span style={{ 
              marginLeft: "auto",
              fontSize: "0.875rem", 
              fontWeight: "500", 
              color: "rgba(255, 255, 255, 0.6)",
            }}>
              Super Admin
            </span>
          </>
        )}
      </div>

      {/* Navigation Items */}
      <div style={{ padding: isCollapsed ? "1rem 0" : "1.5rem 0" }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
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
                borderLeft: isActive && !isCollapsed ? "3px solid #24c598" : "3px solid transparent",
                transition: "all 0.15s ease",
                position: "relative",
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
                <item.icon />
              </span>
              {!isCollapsed && <span style={{ color: "inherit" }}>{item.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Bottom Section - Settings & Logout */}
      <div style={{ 
        marginTop: "auto", 
        paddingTop: "2rem", 
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        padding: isCollapsed ? "1rem 0" : "1.5rem",
      }}>
        {/* Settings Link */}
        <Link
          href="/super-admin/settings"
          onClick={onMobileClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "0.75rem",
            padding: isCollapsed ? "0.75rem" : "0.75rem 0",
            color: "rgba(255, 255, 255, 0.7)",
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FFFFFF"
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"
            e.currentTarget.style.backgroundColor = "transparent"
          }}
          title={isCollapsed ? "Einstellungen" : undefined}
        >
          <span style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "20px",
            height: "20px",
            flexShrink: 0,
          }}>
            <SettingsIcon />
          </span>
          {!isCollapsed && <span style={{ color: "inherit" }}>Einstellungen</span>}
        </Link>

        {/* User Info (Shopware-style) */}
        {userEmail && (
          <div style={{ 
            marginTop: "1rem", 
            paddingTop: "1rem", 
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "0.75rem",
            padding: isCollapsed ? "1rem 0 0 0" : "1rem 0 0 0",
          }}>
            {/* Avatar */}
            <div style={{
              width: isCollapsed ? "32px" : "40px",
              height: isCollapsed ? "32px" : "40px",
              borderRadius: "50%",
              backgroundColor: "#24c598",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: isCollapsed ? "0.75rem" : "0.875rem",
              fontWeight: "600",
              flexShrink: 0,
            }}>
              {(userEmail || "A").charAt(0).toUpperCase()}
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
                  {userEmail?.split("@")[0] || "Super Admin"}
                </p>
                {userRole && (
                  <p style={{ 
                    fontSize: "0.75rem", 
                    color: "#24c598",
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
                // DEBUG: Log logout execution (remove in production)
                console.log("[Logout] Logout button clicked");
                
                // Clear cookie immediately on client side
                document.cookie = "super_admin_session=; path=/; max-age=0; domain=" + window.location.hostname;
                
                // Call logout API (best effort)
                try {
                  const response = await apiFetch("/api/super-admin/auth/logout", {
                    method: "POST",
                  });
                  console.log("[Logout] Response status:", response.status);
                } catch (error) {
                  console.error("[Logout] API call failed:", error);
                }
                
                // Always redirect to login immediately
                window.location.href = "/super-admin/login";
              } catch (error) {
                console.error("[Logout] Error:", error);
                // Even on error, redirect to login
                window.location.href = "/super-admin/login";
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 0",
              backgroundColor: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "0.95rem",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
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
              <LogoutIcon />
            </span>
            <span style={{ color: "inherit" }}>Abmelden</span>
          </button>
        )}

        {/* Toggle Button (ganz unten) */}
        {onToggleCollapse && (
          <div style={{ 
            marginTop: "1rem", 
            paddingTop: "1rem", 
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}>
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
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  )
}
