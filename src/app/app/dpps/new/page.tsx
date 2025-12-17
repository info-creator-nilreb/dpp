export const dynamic = "force-dynamic"

import NewDppContent from "./NewDppContent"
import AuthGate from "../../_auth/AuthGate"

export default function NewDppPage() {
  return (
    <AuthGate>
      <NewDppContent />
    </AuthGate>
  )
}
