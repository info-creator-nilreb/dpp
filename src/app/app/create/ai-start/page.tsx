export const dynamic = "force-dynamic"

import AiStartDppContent from "./AiStartDppContent"
import AuthGate from "../../_auth/AuthGate"

export default async function AiStartDppPage() {
  return (
    <AuthGate>
      <AiStartDppContent />
    </AuthGate>
  )
}

