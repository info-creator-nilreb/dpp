import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isLoggedIn = !!session

  // Extrahiere die aktuelle Origin (inkl. Port) aus der Request
  const origin = req.headers.get("host") || req.nextUrl.host
  const protocol = req.nextUrl.protocol || "http:"
  const baseUrl = `${protocol}//${origin}`

  // Öffentliche Routen
  const publicRoutes = ["/", "/login", "/signup", "/onboarding"]
  const isPublicRoute = publicRoutes.includes(pathname)

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

  // Wenn nicht eingeloggt und geschützte Route → Redirect zu Login
  if (!isLoggedIn && (isAppRoute || isPlatformRoute)) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  // Platform-Routen: Nur für Platform-Admin
  if (isLoggedIn && isPlatformRoute) {
    const isAdmin = session.user?.isPlatformAdmin === true
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/app/dashboard", baseUrl))
    }
  }

  // App-Routen: Zugriff erlauben (Membership-Prüfung erfolgt im Layout)
  // WICHTIG: Prisma kann nicht im Edge Runtime (Middleware) verwendet werden
  // Die eigentliche Membership-Prüfung erfolgt in den Server Components (Layout)
  if (isLoggedIn && isAppRoute) {
    if (!session.user?.id) {
      return NextResponse.redirect(new URL("/login", baseUrl))
    }
    // Zugriff erlauben - Membership-Prüfung erfolgt im App-Layout
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
