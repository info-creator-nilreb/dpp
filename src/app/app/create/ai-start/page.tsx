export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { auth } from "@/auth"
import AiStartDppContent from "./AiStartDppContent"
import AuthGate from "../../_auth/AuthGate"
import { hasFeature } from "@/lib/capabilities/resolver"
import { prisma } from "@/lib/prisma"

export default async function AiStartDppPage() {
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  // Get organization ID from membership (not from session)
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: { id: true }
      }
    }
  })

  if (!membership?.organization) {
    notFound()
  }

  const orgId = membership.organization.id

  // Check if AI analysis feature is available
  const canUseAiAnalysis = await hasFeature("ai_analysis", {
    organizationId: orgId,
    userId: session.user.id,
  })

  if (!canUseAiAnalysis) {
    notFound()
  }

  return (
    <AuthGate>
      <AiStartDppContent />
    </AuthGate>
  )
}

