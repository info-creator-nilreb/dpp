export const dynamic = "force-dynamic"

import VersionsContent from "./VersionsContent"
import AuthGate from "../../../_auth/AuthGate"

export default async function VersionsPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <AuthGate>
      <VersionsContent id={params.id} />
    </AuthGate>
  )
}
