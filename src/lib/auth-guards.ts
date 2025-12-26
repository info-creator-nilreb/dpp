/**
 * AUTHORIZATION GUARDS
 * 
 * Strict separation of concerns:
 * - requireSession(): checks session exists and is valid (NO role check)
 * - requireRole(role): assumes session exists, checks role only
 * 
 * Rules:
 * - Logout endpoint must ONLY use requireSession()
 * - Feature Registry must use: requireSession() + requireRole('super_admin')
 * - Logout must NEVER check subscription, plan, or feature flags
 */

import { NextResponse } from "next/server";
import { resolveSession, ResolvedSession } from "./session-resolver";

/**
 * requireSession()
 * 
 * Checks session exists and is valid.
 * Does NOT check role.
 * Returns user or throws error.
 * 
 * Use this for:
 * - Logout endpoints (must work even if session is partially invalid)
 * - Any endpoint that needs to know WHO is making the request
 */
export async function requireSession(): Promise<ResolvedSession> {
  const session = await resolveSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

/**
 * requireRole(role)
 * 
 * Assumes session exists (call requireSession() first).
 * Checks role only.
 * 
 * Use this AFTER requireSession():
 * 
 * const session = await requireSession();
 * requireRole(session, 'super_admin');
 */
export function requireRole(
  session: ResolvedSession,
  allowedRoles: string | string[]
): boolean {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(session.role);
}

/**
 * requireRoleOrThrow()
 * 
 * Convenience function that throws if role doesn't match.
 */
export function requireRoleOrThrow(
  session: ResolvedSession,
  allowedRoles: string | string[]
): void {
  if (!requireRole(session, allowedRoles)) {
    throw new Error("Forbidden");
  }
}

/**
 * API Guard Helper
 * 
 * Wraps requireSession() with error handling for API routes.
 */
export async function requireSessionApi(): Promise<
  ResolvedSession | NextResponse
> {
  try {
    return await requireSession();
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * API Guard Helper with Role Check
 * 
 * Example usage:
 * const session = await requireSessionApi();
 * if (session instanceof NextResponse) return session;
 * requireRoleOrThrow(session, 'super_admin');
 */
export async function requireSessionAndRoleApi(
  allowedRoles: string | string[]
): Promise<ResolvedSession | NextResponse> {
  const session = await requireSessionApi();
  
  if (session instanceof NextResponse) {
    return session;
  }
  
  try {
    requireRoleOrThrow(session, allowedRoles);
    return session;
  } catch (error: any) {
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * WRONG USAGE EXAMPLES (DO NOT DO THIS):
 * 
 * ❌ BAD: Checking role in logout
 * export async function POST() {
 *   const session = await requireSession();
 *   requireRole(session, 'super_admin'); // WRONG - logout should work for all
 *   await destroySession();
 * }
 * 
 * ❌ BAD: Checking subscription in Feature Registry
 * export async function GET() {
 *   const session = await requireSession();
 *   const subscription = await getSubscription(session.id); // WRONG
 *   if (subscription.status !== 'active') { // WRONG
 *     return NextResponse.json({ error: "..." }, { status: 403 });
 *   }
 * }
 * 
 * ✅ CORRECT: Feature Registry
 * export async function GET() {
 *   const session = await requireSessionAndRoleApi('super_admin');
 *   if (session instanceof NextResponse) return session;
 *   // Now you can safely use session
 * }
 * 
 * ✅ CORRECT: Logout
 * export async function POST() {
 *   const session = await requireSession(); // No role check!
 *   await destroySession();
 *   return NextResponse.json({ success: true });
 * }
 */

