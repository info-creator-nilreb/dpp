export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import DppEditor from "@/components/DppEditor"
import AuthGate from "../../_auth/AuthGate"

async function DppEditorContent({
  dppId,
}: {
  dppId: string
}) {
  // Prüfe Zugriff und lade DPP via API
  let dpp: any = null
  try {
    // Prüfe Zugriff
    const accessResponse = await fetch(`/api/app/dpp/${dppId}/access`, {
      cache: "no-store",
    })
    if (!accessResponse.ok) {
      const accessData = await accessResponse.json()
      if (!accessData.hasAccess) {
        redirect("/app/dashboard")
      }
    }

    // Lade DPP mit Medien und Content
    const dppResponse = await fetch(`/api/app/dpp/${dppId}`, {
      cache: "no-store",
    })
    if (dppResponse.ok) {
      const data = await dppResponse.json()
      dpp = data.dpp
      
      // Füge fieldValues und fieldInstances zum DPP-Objekt hinzu, damit sie später geladen werden können
      if (data.fieldValues || data.fieldInstances) {
        (dpp as any)._fieldValues = data.fieldValues || {}
        ;(dpp as any)._fieldInstances = data.fieldInstances || {}
        console.log("[DppEditorContent] Loaded field values:", Object.keys(data.fieldValues || {}).length, "fields")
        console.log("[DppEditorContent] Loaded field instances:", Object.keys(data.fieldInstances || {}).length, "repeatable fields")
      }
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
    })),
    // Behalte _fieldValues und _fieldInstances
    _fieldValues: (dpp as any)._fieldValues || {},
    _fieldInstances: (dpp as any)._fieldInstances || {}
  }

  return <DppEditor dpp={normalizedDpp} isNew={false} />
}

export default async function DppEditorPage({
  params,
}: {
  params: Promise<{ dppId: string }>
}) {
  const { dppId } = await params
  return (
    <AuthGate>
      <DppEditorContent dppId={dppId} />
    </AuthGate>
  )
}
