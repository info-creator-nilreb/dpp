import AuthGate from "../_auth/AuthGate"
import { AccountPageContent } from "./AccountPageContent"

export default function AccountPage() {
  return (
    <AuthGate>
      <AccountPageContent />
    </AuthGate>
  )
}
