"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

const CHECK_INTERVAL_MS = 60_000 // 1 Minute

/**
 * Prüft periodisch und bei Tab-Fokus, ob der globale Passwortschutz-Cookie noch gültig ist.
 * Bei Ablauf sofort zu /password weiterleiten (ohne Reload abzuwarten).
 */
export default function PasswordProtectionSessionCheck() {
  const pathname = usePathname()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (pathname === "/password" || pathname.startsWith("/super-admin")) return

    async function check() {
      try {
        const res = await fetch("/api/password/check", { credentials: "include" })
        if (res.status === 401) {
          const callbackUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
          window.location.href = `/password?callbackUrl=${encodeURIComponent(callbackUrl)}`
        }
      } catch {
        // Netzwerkfehler – nicht weiterleiten, beim nächsten Check erneut versuchen
      }
    }

    check()
    intervalRef.current = setInterval(check, CHECK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [pathname])

  useEffect(() => {
    if (!pathname || pathname === "/password" || pathname.startsWith("/super-admin")) return

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetch("/api/password/check", { credentials: "include" })
          .then((res) => {
            if (res.status === 401) {
              const callbackUrl = window.location.pathname + window.location.search
              window.location.href = `/password?callbackUrl=${encodeURIComponent(callbackUrl)}`
            }
          })
          .catch(() => {})
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [pathname])

  return null
}
