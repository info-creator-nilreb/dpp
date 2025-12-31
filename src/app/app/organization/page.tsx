export const dynamic = "force-dynamic"

import AuthGate from "../_auth/AuthGate"
import OrganizationClient from "./OrganizationClient"

export default async function OrganizationPage() {
  return (
    <AuthGate>
      <OrganizationClient />
    </AuthGate>
  )
}

