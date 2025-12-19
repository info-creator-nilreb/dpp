export const dynamic = "force-dynamic"

import CreateDppContent from "./CreateDppContent"
import AuthGate from "../../_auth/AuthGate"

export default function CreateDppPage() {
  return (
    <AuthGate>
      <CreateDppContent />
    </AuthGate>
  )
}

