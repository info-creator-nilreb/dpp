import { Suspense } from "react"
import PasswordPageWrapper from "./PasswordPageWrapper"
import { LoginSplitLayout } from "@/components/LoginSplitLayout"

export const dynamic = "force-dynamic"

interface PasswordPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default function PasswordPage({ searchParams }: PasswordPageProps) {
  return (
    <Suspense fallback={
      <LoginSplitLayout>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#7A7A7A" }}>Wird geladen...</p>
        </div>
      </LoginSplitLayout>
    }>
      <PasswordPageWrapper searchParams={searchParams} />
    </Suspense>
  )
}
