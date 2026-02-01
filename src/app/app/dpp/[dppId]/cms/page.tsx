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
  dppId,
}: {
  dppId: string
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/app/dashboard")
  }

  // Check permissions
  const permissionError = await requireViewDPP(dppId, session.user.id)
  if (permissionError) {
    redirect("/app/dashboard")
  }

  // Load DPP to get organization
  const dpp = await prisma.dpp.findUnique({
    where: { id: dppId },
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
  params: Promise<{ dppId: string }>
}) {
  const { dppId } = await params
  return (
    <AuthGate>
      <CmsEditorPageContent dppId={dppId} />
    </AuthGate>
  )
}

