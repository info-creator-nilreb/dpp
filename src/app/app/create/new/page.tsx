export const dynamic = "force-dynamic"

import NewDppContent from "./NewDppContent"
import AuthGate from "../../_auth/AuthGate"
import { getCategoriesWithPublishedTemplates } from "@/lib/template-helpers"

export default async function NewDppPage() {
  // Nur Kategorien mit veröffentlichten Templates laden
  const availableCategories = await getCategoriesWithPublishedTemplates()

  return (
    <AuthGate>
      <NewDppContent availableCategories={availableCategories} />
    </AuthGate>
  )
}
