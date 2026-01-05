import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { superAdminMiddleware } from "./middleware-super-admin"
import { hasPasswordProtectionAccessEdge } from "./lib/password-protection-edge"

export default auth(async (req) => {
  const { pathname } = req.nextUrl

  // 🔴 FIX: Super Admin UI UND API Routen abfangen (UNPROTECTED)
  if (
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/api/super-admin")
  ) {
    const superAdminResponse = await superAdminMiddleware(req)
    // Set pathname header for Super-Admin routes too (so PasswordProtectionWrapper can skip them)
    superAdminResponse.headers.set("x-pathname", pathname)
    return superAdminResponse
  }

  // PASSWORD PROTECTION: Skip check in middleware (Edge Runtime can't use Prisma)
  // Full check is done in PasswordProtectionWrapper (Server Component with Prisma access)
  // Set header with pathname so Server Components can access it
  const response = NextResponse.next()
  response.headers.set("x-pathname", pathname)

  // Continue with tenant/user auth (existing logic)
  const session = req.auth
  const isLoggedIn = !!session

  // Extrahiere die aktuelle Origin (inkl. Port) aus der Request
  const origin = req.headers.get("host") || req.nextUrl.host
  const protocol = req.nextUrl.protocol || "http:"
  const baseUrl = `${protocol}//${origin}`

  // Öffentliche Routen
  const publicRoutes = ["/", "/login", "/signup", "/onboarding"]
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/contribute")

  // Auth-Routen (Login, Signup) - Landingpage "/" ist NICHT dabei
  const isAuthRoute = pathname === "/login" || pathname === "/signup"

  // Geschützte Routen - AUSSCHLIESSLICH /app/** wird hier geschützt
  const isAppRoute = pathname.startsWith("/app")
  const isPlatformRoute = pathname.startsWith("/platform")

  // TEIL 3: Wenn Session existiert UND Route ist Login/Signup → Redirect zu Dashboard
  // Landingpage "/" bleibt auch für eingeloggte User zugänglich
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/app/dashboard", baseUrl))
  }

  // Wenn nicht eingeloggt und geschützte Route → Redirect zu Login mit callbackUrl
  if (!isLoggedIn && (isAppRoute || isPlatformRoute)) {
    const loginUrl = new URL("/login", baseUrl)
    // Speichere die ursprüngliche URL als callbackUrl, damit der User nach Login dorthin zurückkommt
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Platform-Routen: Nur für Platform-Admin
  if (isLoggedIn && isPlatformRoute) {
    const isAdmin = session.user?.isPlatformAdmin === true
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/app/dashboard", baseUrl))
    }
  }

  // App-Routen: Zugriff erlauben (Membership-Prüfung erfolgt im Layout)
  // WICHTIG: Prisma kann nicht im Edge Runtime (Middleware) verwendet wird
  if (isLoggedIn && isAppRoute) {
    if (!session.user?.id) {
      return NextResponse.redirect(new URL("/login", baseUrl))
    }
    return response
  }

  return response
})

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/api/super-admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
}
