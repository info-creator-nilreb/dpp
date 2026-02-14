"use client"

import { usePathname } from "next/navigation"
import PublicLayoutClient from "./PublicLayoutClient"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

/**
 * Conditional Layout Wrapper
 *
 * Wraps with PublicLayoutClient. useChrome=false hides sidebar/header for app,
 * super-admin, public/dpp, contribute, password routes.
 * Pathname comes directly from usePathname() so server and client render the same DOM (avoids hydration mismatch).
 */
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname() ?? ""

  const useChrome =
    !pathname.startsWith("/super-admin") &&
    !pathname.startsWith("/app") &&
    !pathname.startsWith("/public/dpp") &&
    !pathname.startsWith("/contribute") &&
    pathname !== "/password"

  return (
    <PublicLayoutClient useChrome={useChrome}>
      {children}
    </PublicLayoutClient>
  )
}


