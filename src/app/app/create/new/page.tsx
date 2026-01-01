export const dynamic = "force-dynamic"

import NewDppContent from "./NewDppContent"
import AuthGate from "../../_auth/AuthGate"
import { getCategoriesWithPublishedTemplates } from "@/lib/template-helpers"

export default async function NewDppPage() {
  // Nur Kategorien mit veröffentlichten Templates laden
  console.log("[NewDppPage] ===== START ======")
  console.log("[NewDppPage] Starte getCategoriesWithPublishedTemplates...")
  
  try {
    const availableCategories = await getCategoriesWithPublishedTemplates()
    console.log("[NewDppPage] availableCategories:", JSON.stringify(availableCategories, null, 2))
    console.log("[NewDppPage] Anzahl Kategorien:", availableCategories.length)
    
    return (
      <AuthGate>
        <NewDppContent availableCategories={availableCategories} />
      </AuthGate>
    )
  } catch (error) {
    console.error("[NewDppPage] FEHLER:", error)
    throw error
  }
}
