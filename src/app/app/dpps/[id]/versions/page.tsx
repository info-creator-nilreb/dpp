export const dynamic = "force-dynamic"

import VersionsContent from "./VersionsContent"
import AuthGate from "../../../_auth/AuthGate"

export default async function VersionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return (
    <AuthGate>
      <VersionsContent id={resolvedParams.id} />
    </AuthGate>
  )
}
