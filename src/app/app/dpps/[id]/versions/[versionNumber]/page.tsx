export const dynamic = "force-dynamic"

import VersionViewContent from "./VersionViewContent"
import AuthGate from "../../../../_auth/AuthGate"

export default async function VersionViewPage({
  params,
}: {
  params: { id: string; versionNumber: string }
}) {
  return (
    <AuthGate>
      <VersionViewContent id={params.id} versionNumber={params.versionNumber} />
    </AuthGate>
  )
}
