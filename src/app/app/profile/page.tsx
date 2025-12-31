export const dynamic = "force-dynamic"

import AuthGate from "../_auth/AuthGate"
import ProfileClient from "./ProfileClient"

export default async function ProfilePage() {
  return (
    <AuthGate>
      <ProfileClient />
    </AuthGate>
  )
}

