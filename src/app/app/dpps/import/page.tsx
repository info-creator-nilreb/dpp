import { redirect } from "next/navigation"

/**
 * Legacy Route: Redirect to new route
 * 
 * This route is deprecated. All DPP imports should use /app/create/import
 */
export default function LegacyImportDppPage() {
  redirect("/app/create/import")
}
