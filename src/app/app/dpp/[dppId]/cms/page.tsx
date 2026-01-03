/**
 * CMS Editor Page
 * 
 * Route: /app/dpp/[dppId]/cms
 */

export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireViewDPP } from "@/lib/api-permissions"
import CmsEditor from "@/components/cms/CmsEditor"
import AuthGate from "../../../_auth/AuthGate"

async function CmsEditorPageContent({
  params,
}: {
  params: { dppId: string }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/app/dashboard")
  }

  // Check permissions
  const permissionError = await requireViewDPP(params.dppId, session.user.id)
  if (permissionError) {
    redirect("/app/dashboard")
  }

  // Load DPP to get organization
  const dpp = await prisma.dpp.findUnique({
    where: { id: params.dppId },
    select: {
      id: true,
      organizationId: true
    }
  })

  if (!dpp) {
    redirect("/app/dashboard")
  }

  return (
    <CmsEditor
      dppId={dpp.id}
      organizationId={dpp.organizationId}
      userId={session.user.id}
    />
  )
}

export default async function CmsEditorPage({
  params,
}: {
  params: { dppId: string }
}) {
  return (
    <AuthGate>
      <CmsEditorPageContent params={params} />
    </AuthGate>
  )
}

