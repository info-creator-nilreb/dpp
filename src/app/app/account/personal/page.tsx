import AuthGate from "../../_auth/AuthGate"
import { PersonalDataPageContent } from "./PersonalDataPageContent"

export default function PersonalDataPage() {
  return (
    <AuthGate>
      <PersonalDataPageContent />
    </AuthGate>
  )
}

