import PasswordPageWrapper from "./PasswordPageWrapper"

export const dynamic = "force-dynamic"

interface PasswordPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default function PasswordPage({ searchParams }: PasswordPageProps) {
  return <PasswordPageWrapper searchParams={searchParams} />
}
