export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import ImportDppContent from "./ImportDppContent"
import AuthGate from "../../_auth/AuthGate"
import { getCategoriesWithPublishedTemplates } from "@/lib/template-helpers"
import { hasFeature } from "@/lib/capabilities/resolver"

export default async function ImportDppPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get organization ID from session
  const orgId = (session.user as any).organizationId

  if (!orgId) {
    redirect("/app/select-plan")
  }

  // Check if CSV import feature is available
  const canUseCsvImport = await hasFeature("csv_import", {
    organizationId: orgId,
    userId: session.user.id,
  })

  if (!canUseCsvImport) {
    redirect("/app/create")
  }

  // Nur Kategorien mit veröffentlichten Templates laden
  const availableCategories = await getCategoriesWithPublishedTemplates()

  return (
    <AuthGate>
      <ImportDppContent availableCategories={availableCategories} />
    </AuthGate>
  )
}

