export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import AiStartDppContent from "./AiStartDppContent"
import AuthGate from "../../_auth/AuthGate"
import { hasFeature } from "@/lib/capabilities/resolver"

export default async function AiStartDppPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get organization ID from session
  const orgId = (session.user as any).organizationId

  if (!orgId) {
    redirect("/app/select-plan")
  }

  // Check if AI analysis feature is available
  const canUseAiAnalysis = await hasFeature("ai_analysis", {
    organizationId: orgId,
    userId: session.user.id,
  })

  if (!canUseAiAnalysis) {
    redirect("/app/create")
  }

  return (
    <AuthGate>
      <AiStartDppContent />
    </AuthGate>
  )
}

