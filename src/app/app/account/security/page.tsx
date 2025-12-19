import AuthGate from "../../_auth/AuthGate"
import { SecurityPageContent } from "./SecurityPageContent"

export default function SecurityPage() {
  return (
    <AuthGate>
      <SecurityPageContent />
    </AuthGate>
  )
}

