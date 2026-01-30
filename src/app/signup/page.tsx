import React, { Suspense } from "react"
import SignupForm from "./SignupForm"

export const dynamic = "force-dynamic"

interface SignupPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams
  const invitationParam = params?.invitation
  const initialInvitationToken =
    typeof invitationParam === "string" ? invitationParam : null

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F5F5F5",
            padding: "1rem",
          }}
        >
          <div style={{ color: "#7A7A7A" }}>Lade...</div>
        </div>
      }
    >
      <SignupForm initialInvitationToken={initialInvitationToken} />
    </Suspense>
  )
}
