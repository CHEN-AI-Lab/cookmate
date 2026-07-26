/**
 * Demo cookie utilities — separate demo user state from NextAuth session.
 *
 * Instead of creating a real NextAuth Credentials session for the demo user,
 * we use a simple HttpOnly cookie. This prevents the demo user from being
 * linked to real OAuth accounts (the root cause of the GitHub→demo bug).
 */

const DEMO_COOKIE_NAME = "cookmate_demo"

/** Demo user object returned by auth() when the demo cookie is present. */
export const DEMO_SESSION = {
  user: {
    id: "demo-user-id",
    name: "体验用户",
    email: "demo@cookmate.local",
    phone: "",
    subscriptionTier: "FREE" as const,
    onboardingCompleted: false,
    provider: "demo" as const,
    loginMethod: "体验演示" as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

/** Parse the cookie header manually for edge environments. */
export function hasDemoCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false
  return cookieHeader.split(";").some((c) => c.trim().startsWith(`${DEMO_COOKIE_NAME}=true`))
}

/** Build a Set-Cookie header value to set the demo cookie. */
export function buildSetDemoCookieHeader(): string {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
  return `${DEMO_COOKIE_NAME}=true; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`
}

/** Build a Set-Cookie header value to clear the demo cookie. */
export function buildClearDemoCookieHeader(): string {
  return `${DEMO_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}