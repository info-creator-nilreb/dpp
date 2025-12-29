export const dynamic = "force-dynamic"

import AuthGate from "../_auth/AuthGate"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  return (
    <AuthGate>
      <DashboardClient />
    </AuthGate>
  )
}
