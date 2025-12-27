import { redirect } from "next/navigation"

/**
 * Super Admin Root Route
 * 
 * Redirects to login page
 */
export default function SuperAdminPage() {
  redirect("/super-admin/login")
}

