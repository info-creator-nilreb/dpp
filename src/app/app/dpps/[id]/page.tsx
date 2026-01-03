export const dynamic = "force-dynamic"

import DppEditorContent from "./DppEditorContent"
import AuthGate from "../../_auth/AuthGate"

export default async function DppEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const resolvedParams = await params
    if (!resolvedParams?.id) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600">Fehler</h1>
          <p>Keine DPP-ID gefunden</p>
        </div>
      )
    }
    
    return (
      <AuthGate>
        <DppEditorContent id={resolvedParams.id} />
      </AuthGate>
    )
  } catch (error: any) {
    console.error("Error in DppEditorPage:", error)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Fehler</h1>
        <p>{error?.message || "Ein Fehler ist aufgetreten"}</p>
      </div>
    )
  }
}
