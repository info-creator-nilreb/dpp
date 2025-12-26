/**
 * SUPER ADMIN LOGOUT API
 * 
 * HARD REQUIREMENT: Logout must ALWAYS work if a session exists.
 * - Clears cookies/tokens unconditionally
 * - Succeeds even if session is expired or partially invalid
 * - NEVER throws 401 itself
 * - Does NOT check role (anyone with a session can logout)
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "super_admin_session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // ALWAYS clear the cookie FIRST, regardless of session validity
  // This ensures logout always works, even if session is expired
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  // Try to invalidate session in database (best effort, don't fail if it doesn't work)
  if (token) {
    try {
      const { jwtVerify } = await import("jose");
      const JWT_SECRET = new TextEncoder().encode(
        process.env.SUPER_ADMIN_JWT_SECRET ||
          process.env.AUTH_SECRET ||
          "super-admin-secret-change-in-production"
      );
      
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const sessionId = (payload as any).sessionId as string | undefined;

        if (sessionId) {
          await prisma.superAdminSession.deleteMany({
            where: { token: sessionId },
          });
        }
      } catch (error) {
        // Token invalid or expired - that's fine, cookie is already cleared
        console.log("[Logout] Token invalid/expired, cookie already cleared");
      }
    } catch (error) {
      // JWT verification failed - that's fine, cookie is already cleared
      console.log("[Logout] Could not verify token, cookie already cleared");
    }
  }

  // ALWAYS return success - logout should never fail
  return NextResponse.json({ success: true });

}
