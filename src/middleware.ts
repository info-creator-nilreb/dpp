import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isLoggedIn = !!session

  // Öffentliche Routen (Landingpage bleibt unverändert)
  const publicRoutes = ["/", "/login", "/signup"]
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Onboarding-Route (geschützt, aber nicht durch App-Layout)
  const isOnboardingRoute = pathname === "/onboarding"

  // Geschützte Routen
  const isAppRoute = pathname.startsWith("/app")
  const isPlatformRoute = pathname.startsWith("/platform")

  // Wenn nicht eingeloggt und geschützte Route → Redirect zu Login
  if (!isLoggedIn && (isAppRoute || isPlatformRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Platform-Routen: Nur für Platform-Admin
  if (isLoggedIn && isPlatformRoute) {
    const isAdmin = session.user?.isPlatformAdmin === true
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/app/dashboard", req.url))
    }
  }

  // App-Routen: Zugriff erlauben (Membership-Prüfung erfolgt im Layout)
  // WICHTIG: Prisma kann nicht im Edge Runtime (Middleware) verwendet werden
  // Die eigentliche Membership-Prüfung erfolgt in den Server Components (Layout)
  if (isLoggedIn && isAppRoute) {
    if (!session.user?.id) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    // Zugriff erlauben - Membership-Prüfung erfolgt im App-Layout
    return NextResponse.next()
  }

  // Wenn eingeloggt und auf Login/Signup → Redirect zu Dashboard
  // WICHTIG: Keine Prisma-Queries hier, da Middleware im Edge Runtime läuft
  // Die Membership-Prüfung und Onboarding-Prüfung erfolgen im App-Layout
  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    // Weiterleitung zu Dashboard - Layout prüft dann die Membership und Onboarding
    return NextResponse.redirect(new URL("/app/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
