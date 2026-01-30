export const dynamic = "force-dynamic"

import VersionViewContent from "./VersionViewContent"
import AuthGate from "../../../../_auth/AuthGate"

export default async function VersionViewPage({
  params,
}: {
  params: Promise<{ id: string; versionNumber: string }>
}) {
  const { id, versionNumber } = await params
  return (
    <AuthGate>
      <VersionViewContent id={id} versionNumber={versionNumber} />
    </AuthGate>
  )
}
