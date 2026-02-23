export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AuthGate from "../../../_auth/AuthGate"
import DppStatsContent from "./DppStatsContent"

export default async function DppStatsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  return (
    <AuthGate>
      <DppStatsContent dppId={id} />
    </AuthGate>
  )
}
