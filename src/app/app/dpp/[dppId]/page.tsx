export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import DppEditor from "@/components/DppEditor"
import AuthGate from "../../_auth/AuthGate"

async function DppEditorContent({
  params,
}: {
  params: { dppId: string }
}) {
  // Prüfe Zugriff und lade DPP via API
  let dpp: any = null
  try {
    // Prüfe Zugriff
    const accessResponse = await fetch(`/api/app/dpp/${params.dppId}/access`, {
      cache: "no-store",
    })
    if (!accessResponse.ok) {
      const accessData = await accessResponse.json()
      if (!accessData.hasAccess) {
        redirect("/app/dashboard")
      }
    }

    // Lade DPP mit Medien
    const dppResponse = await fetch(`/api/app/dpp/${params.dppId}`, {
      cache: "no-store",
    })
    if (dppResponse.ok) {
      const data = await dppResponse.json()
      dpp = data.dpp
    }
  } catch (error) {
    console.error("Error loading DPP:", error)
  }

  if (!dpp) {
    redirect("/app/dashboard")
  }

  // Normalize category to expected union type for Dpp
  const categoryValues = ["TEXTILE", "FURNITURE", "OTHER"] as const
  type CategoryType = typeof categoryValues[number];
  const normalizedDpp = {
    ...dpp,
    category: categoryValues.includes(dpp.category as CategoryType)
      ? (dpp.category as CategoryType)
      : "OTHER",
    createdAt: new Date(dpp.createdAt),
    updatedAt: new Date(dpp.updatedAt),
    media: dpp.media.map((m: any) => ({
      ...m,
      uploadedAt: new Date(m.uploadedAt)
    }))
  }

  return <DppEditor dpp={normalizedDpp} isNew={false} />
}

export default async function DppEditorPage({
  params,
}: {
  params: { dppId: string }
}) {
  return (
    <AuthGate>
      <DppEditorContent params={params} />
    </AuthGate>
  )
}
