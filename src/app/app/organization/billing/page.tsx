export const dynamic = "force-dynamic"

import AuthGate from "../../_auth/AuthGate"
import BillingClient from "./BillingClient"

export default async function BillingPage() {
  return (
    <AuthGate>
      <BillingClient />
    </AuthGate>
  )
}

