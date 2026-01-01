export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { auth } from "@/auth"
import ImportDppContent from "./ImportDppContent"
import AuthGate from "../../_auth/AuthGate"
import { getCategoriesWithPublishedTemplates } from "@/lib/template-helpers"
import { hasFeature } from "@/lib/capabilities/resolver"
import { prisma } from "@/lib/prisma"

export default async function ImportDppPage() {
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

  // Check if CSV import feature is available
  const canUseCsvImport = await hasFeature("csv_import", {
    organizationId: orgId,
    userId: session.user.id,
  })

  if (!canUseCsvImport) {
    notFound()
  }

  // Nur Kategorien mit veröffentlichten Templates laden
  console.log("[ImportDppPage] ===== START ======")
  console.log("[ImportDppPage] Starte getCategoriesWithPublishedTemplates...")
  
  try {
    const availableCategories = await getCategoriesWithPublishedTemplates()
    console.log("[ImportDppPage] availableCategories:", JSON.stringify(availableCategories, null, 2))
    console.log("[ImportDppPage] Anzahl Kategorien:", availableCategories.length)

    return (
      <AuthGate>
        <ImportDppContent availableCategories={availableCategories} />
      </AuthGate>
    )
  } catch (error) {
    console.error("[ImportDppPage] FEHLER:", error)
    throw error
  }
}

