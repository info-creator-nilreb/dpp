export const dynamic = "force-dynamic"

import AuthGate from "../../_auth/AuthGate"
import SubscriptionPlanClient from "./SubscriptionPlanClient"

export default async function OrganizationSubscriptionPage() {
  return (
    <AuthGate>
      <SubscriptionPlanClient />
    </AuthGate>
  )
}
