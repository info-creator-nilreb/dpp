export const dynamic = "force-dynamic"

import AuthGate from "../_auth/AuthGate"
import TestPageClient from "./TestPageClient"

export default function TestPage() {
  return (
    <AuthGate>
      <TestPageClient />
    </AuthGate>
  )
}
