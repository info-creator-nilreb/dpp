export const dynamic = "force-dynamic"

import ImportDppContent from "./ImportDppContent"
import AuthGate from "../../_auth/AuthGate"
import { getCategoriesWithPublishedTemplates } from "@/lib/template-helpers"

export default async function ImportDppPage() {
  // Nur Kategorien mit veröffentlichten Templates laden
  const availableCategories = await getCategoriesWithPublishedTemplates()

  return (
    <AuthGate>
      <ImportDppContent availableCategories={availableCategories} />
    </AuthGate>
  )
}

