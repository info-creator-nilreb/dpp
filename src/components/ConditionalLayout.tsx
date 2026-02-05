"use client"

import { usePathname } from "next/navigation"
import PublicLayoutClient from "./PublicLayoutClient"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

/**
 * Conditional Layout Wrapper
 * 
 * Wraps children with PublicLayoutClient only for non-super-admin routes.
 * Super-admin routes, app routes, and public editorial routes use their own layout 
 * and should not have the public sidebar/burger menu.
 */
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isSuperAdminRoute = pathname?.startsWith("/super-admin")
  const isAppRoute = pathname?.startsWith("/app")
  const isPublicEditorialRoute = pathname?.startsWith("/public/dpp")
  const isContributeRoute = pathname?.startsWith("/contribute")
  const isPasswordGateRoute = pathname === "/password"

  // Super-admin, app, public editorial, contribute und Passwort-Gate ohne Burger-Menü
  if (isSuperAdminRoute || isAppRoute || isPublicEditorialRoute || isContributeRoute || isPasswordGateRoute) {
    return <>{children}</>
  }

  // All other routes use PublicLayoutClient (includes /login, /signup, /pricing, etc.)
  return <PublicLayoutClient>{children}</PublicLayoutClient>
}


