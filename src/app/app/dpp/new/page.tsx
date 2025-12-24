export const dynamic = "force-dynamic"

import NewDppContent from "./NewDppContent"
import { getCategoriesWithPublishedTemplates } from "@/lib/template-helpers"
import AuthGate from "../../_auth/AuthGate"

/**
 * Neue DPP erstellen (Server Component)
 * 
 * Lädt verfügbare Kategorien mit veröffentlichten Templates
 */
export default async function NewDppPage() {
  // Nur Kategorien mit veröffentlichten Templates laden
  const availableCategories = await getCategoriesWithPublishedTemplates()

  return (
    <AuthGate>
      <NewDppContent availableCategories={availableCategories} />
    </AuthGate>
  )
}

