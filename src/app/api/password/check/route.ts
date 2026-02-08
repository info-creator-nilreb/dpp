/**
 * GET /api/password/check
 *
 * Prüft, ob der globale Passwortschutz-Cookie noch gültig ist.
 * Wird clientseitig periodisch aufgerufen; bei 401 sofort zu /password weiterleiten.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { isPasswordProtectionActive, hasPasswordProtectionAccess } from "@/lib/password-protection"

export async function GET() {
  try {
    const protectionActive = await isPasswordProtectionActive()
    if (!protectionActive) {
      return NextResponse.json({ ok: true })
    }
    const hasAccess = await hasPasswordProtectionAccess()
    if (!hasAccess) {
      return NextResponse.json({ ok: false, reason: "session_expired" }, { status: 401 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
