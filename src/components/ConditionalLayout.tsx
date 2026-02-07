"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import PublicLayoutClient from "./PublicLayoutClient"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

/**
 * Conditional Layout Wrapper
 *
 * Always wraps with PublicLayoutClient so server and client render the same DOM
 * (avoids hydration mismatch). useChrome=false hides sidebar/header for app,
 * super-admin, public/dpp, contribute, password routes.
 */
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathnameFromRouter = usePathname()
  const [pathname, setPathname] = useState<string | null>(null)

  useEffect(() => {
    setPathname(pathnameFromRouter ?? null)
  }, [pathnameFromRouter])

  const useChrome =
    pathname === null ||
    (!pathname.startsWith("/super-admin") &&
      !pathname.startsWith("/app") &&
      !pathname.startsWith("/public/dpp") &&
      !pathname.startsWith("/contribute") &&
      pathname !== "/password")

  return (
    <PublicLayoutClient useChrome={useChrome}>
      {children}
    </PublicLayoutClient>
  )
}


