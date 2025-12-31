export const dynamic = "force-dynamic"

import AuthGate from "../../_auth/AuthGate"
import OrganizationGeneralClient from "./OrganizationGeneralClient"

export default async function OrganizationGeneralPage() {
  return (
    <AuthGate>
      <OrganizationGeneralClient />
    </AuthGate>
  )
}

