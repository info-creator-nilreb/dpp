/**
 * SUPER ADMIN LAYOUT
 * 
 * Protects all /super-admin/* routes except /login
 * Provides persistent sidebar navigation
 */

import { redirect } from "next/navigation"
import { getSuperAdminSession } from "@/lib/super-admin-auth"
import SuperAdminLayoutClient from "./components/LayoutClient"
import { NotificationProvider } from "@/components/NotificationProvider"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get session for user info (middleware already protects routes)
  const session = await getSuperAdminSession()
  
  // If no session and not on login, middleware will redirect
  // For login page, session will be null, which is fine
  if (!session && typeof window === "undefined") {
    // This will be handled by middleware, but we check here to get session data
    // For login page, we don't need session
  }

  return (
    <NotificationProvider>
      <SuperAdminLayoutClient 
        userEmail={session?.email || undefined}
        userRole={session?.role || undefined}
        userName={session?.name || undefined}
      >
        {children}
      </SuperAdminLayoutClient>
    </NotificationProvider>
  )
}

