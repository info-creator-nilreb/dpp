export const dynamic = "force-dynamic"

import DppEditorContent from "./DppEditorContent"
import AuthGate from "../../_auth/AuthGate"

export default async function DppEditorPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <AuthGate>
      <DppEditorContent id={params.id} />
    </AuthGate>
  )
}
