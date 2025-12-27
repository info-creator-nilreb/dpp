import { redirect } from "next/navigation"

/**
 * Legacy Route: Redirect to new route
 * 
 * This route is deprecated. All new DPP creation should use /app/create/new
 */
export default function LegacyNewDppPage() {
  redirect("/app/create/new")
}
