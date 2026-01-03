export const dynamic = "force-dynamic"

import VersionViewContent from "./VersionViewContent"
import AuthGate from "../../../../_auth/AuthGate"

export default async function VersionViewPage({
  params,
}: {
  params: Promise<{ id: string; versionNumber: string }>
}) {
  const resolvedParams = await params
  return (
    <AuthGate>
      <VersionViewContent id={resolvedParams.id} versionNumber={resolvedParams.versionNumber} />
    </AuthGate>
  )
}
