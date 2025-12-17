export const dynamic = "force-dynamic"

import DppsContent from "./DppsContent"
import AuthGate from "../_auth/AuthGate"

export default function DppsPage() {
  return (
    <AuthGate>
      <DppsContent />
    </AuthGate>
  )
}

