export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import DppEditor from "@/components/DppEditor"
import AuthGate from "../../_auth/AuthGate"

async function NewDppContent() {
  // Lade Organizations des Users via API
  let organizations: Array<{ id: string; name: string }> = []
  try {
    const response = await fetch("/api/app/organizations", {
      cache: "no-store",
    })
    if (response.ok) {
      const data = await response.json()
      organizations = data.organizations || []
    }
  } catch (error) {
    console.error("Error loading organizations:", error)
  }

  if (organizations.length === 0) {
    redirect("/app/dashboard")
  }

  // Erstelle leeres DPP-Objekt für Neuanlage
  const emptyDpp = {
    id: "new", // Temporäre ID
    name: "",
    description: null,
    category: "OTHER" as const,
    sku: null,
    gtin: null,
    brand: null,
    countryOfOrigin: null,
    materials: null,
    materialSource: null,
    careInstructions: null,
    isRepairable: null,
    sparePartsAvailable: null,
    lifespan: null,
    conformityDeclaration: null,
    disposalInfo: null,
    takebackOffered: null,
    takebackContact: null,
    secondLifeInfo: null,
    status: "DRAFT",
    organizationId: organizations[0].id,
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: {
      id: organizations[0].id,
      name: organizations[0].name
    },
    media: []
  }

  return <DppEditor dpp={emptyDpp} isNew={true} />
}

export default async function NewDppPage() {
  return (
    <AuthGate>
      <NewDppContent />
    </AuthGate>
  )
}
