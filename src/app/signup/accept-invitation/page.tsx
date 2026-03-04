import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

interface AcceptInvitationPageProps {
  searchParams: Promise<{ token?: string }>
}

/**
 * Einladung annehmen: Weiterleitung auf Signup mit Einladungs-Token.
 * URL: /signup/accept-invitation?token=xxx → /signup?invitation=xxx
 * Die E-Mail kann entweder /signup?invitation=... oder /signup/accept-invitation?token=... verwenden.
 */
export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const params = await searchParams
  const token = typeof params?.token === "string" ? params.token : null

  if (!token) {
    redirect("/signup")
  }

  redirect(`/signup?invitation=${encodeURIComponent(token)}`)
}
