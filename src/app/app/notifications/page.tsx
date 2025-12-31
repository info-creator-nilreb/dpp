export const dynamic = "force-dynamic"

import AuthGate from "../_auth/AuthGate"
import NotificationsClient from "./NotificationsClient"

export default async function NotificationsPage() {
  return (
    <AuthGate>
      <NotificationsClient />
    </AuthGate>
  )
}

