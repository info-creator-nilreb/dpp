export const dynamic = "force-dynamic"

import ImportDppContent from "./ImportDppContent"
import AuthGate from "../../_auth/AuthGate"

export default function ImportDppPage() {
  return (
    <AuthGate>
      <ImportDppContent />
    </AuthGate>
  )
}

