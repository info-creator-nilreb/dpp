export const dynamic = "force-dynamic"

import AuthGate from "../../_auth/AuthGate"
import CompanyDetailsClient from "./CompanyDetailsClient"

export default async function CompanyDetailsPage() {
  return (
    <AuthGate>
      <CompanyDetailsClient />
    </AuthGate>
  )
}

