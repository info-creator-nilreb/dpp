/**
 * Password Page Wrapper (Server Component)
 * 
 * Checks if password protection is actually active before showing the password form.
 * If protection is not active, redirects to the callback URL.
 */

import { redirect } from "next/navigation"
import { isPasswordProtectionActive } from "@/lib/password-protection"
import PasswordPageClient from "./PasswordPageClient"

interface PasswordPageWrapperProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function PasswordPageWrapper({
  searchParams,
}: PasswordPageWrapperProps) {
  const params = await searchParams
  const callbackUrl = params.callbackUrl || "/"
  
  // Check if password protection is actually active
  const protectionActive = await isPasswordProtectionActive()
  
  // If protection is not active, redirect to callback URL
  if (!protectionActive) {
    redirect(callbackUrl)
  }
  
  // Protection is active, show password form
  return <PasswordPageClient callbackUrl={callbackUrl} />
}

