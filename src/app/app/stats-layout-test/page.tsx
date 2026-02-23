export const dynamic = "force-dynamic"

import AuthGate from "../_auth/AuthGate"
import StatsLayoutTestContent from "./StatsLayoutTestContent"

export default function StatsLayoutTestPage() {
  return (
    <AuthGate>
      <StatsLayoutTestContent />
    </AuthGate>
  )
}
