import { redirect } from "next/navigation"

/**
 * Legacy Route: Redirect to new route
 * 
 * This route is deprecated. All DPP creation should use /app/create
 */
export default function LegacyCreateDppPage() {
  redirect("/app/create")
}
