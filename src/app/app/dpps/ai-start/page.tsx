import { redirect } from "next/navigation"

/**
 * Legacy Route: Redirect to new route
 * 
 * This route is deprecated. All AI-assisted DPP creation should use /app/create/ai-start
 */
export default function LegacyAiStartDppPage() {
  redirect("/app/create/ai-start")
}
