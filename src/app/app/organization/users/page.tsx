export const dynamic = "force-dynamic"

import AuthGate from "../../_auth/AuthGate"
import UsersClient from "./UsersClient"

export default async function UsersPage() {
  return (
    <AuthGate>
      <UsersClient />
    </AuthGate>
  )
}

