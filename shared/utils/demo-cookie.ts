/**
 * Demo cookie utilities — separate demo user state from NextAuth session.
 *
 * Instead of creating a real NextAuth Credentials session for the demo user,
 * we use an HttpOnly cookie. This prevents the demo user from being
 * linked to real OAuth accounts (the root cause of the GitHub→demo bug).
 *
 * SECURITY: the cookie is now HMAC-signed with AUTH_SECRET (see H2 in the
 * code-review report). Previously it was the plaintext value `true`, which an
 * attacker could forge to obtain a demo session. Verification is fail-closed:
 * when AUTH_SECRET is set, only a valid signature is accepted.
 */

import crypto from "node:crypto"

const DEMO_COOKIE_NAME = "cookmate_demo"
const DEMO_TOKEN_TTL = 24 * 60 * 60 // seconds

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
  expires: new Date(Date.now() + DEMO_TOKEN_TTL * 1000).toISOString(),
}

function getSecret(): string | null {
  return process.env.AUTH_SECRET || null
}

function base64urlEncode(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64url")
}

function base64urlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf-8")
}

function signHmac(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url")
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

/** Build the signed token. Falls back to a plaintext marker only when no AUTH_SECRET (dev). */
async function signDemoToken(): Promise<string> {
  const secret = getSecret()
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[demo-cookie] AUTH_SECRET 未配置，demo cookie 未签名，存在伪造风险")
      return "insecure-true"
    }
    throw new Error("AUTH_SECRET is required to issue a signed demo cookie")
  }
  const now = Math.floor(Date.now() / 1000)
  const payload = { demo: true, iat: now, exp: now + DEMO_TOKEN_TTL }
  const data = base64urlEncode(JSON.stringify(payload))
  const sig = signHmac(secret, data)
  return `${data}.${sig}`
}

/** Verify the demo cookie signature. Async (HMAC via node:crypto). */
export async function hasDemoCookie(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false
  const raw = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${DEMO_COOKIE_NAME}=`))
  if (!raw) return false

  const value = raw.slice(`${DEMO_COOKIE_NAME}=`.length)

  // Plaintext fallback marker — only valid when no secret is configured (dev).
  if (value === "insecure-true") {
    return getSecret() === null
  }

  const secret = getSecret()
  if (!secret) return false

  const [data, sig] = value.split(".")
  if (!data || !sig) return false
  if (!timingSafeEqual(signHmac(secret, data), sig)) return false

  try {
    const payload = JSON.parse(base64urlDecode(data)) as { demo?: boolean; exp?: number }
    if (payload.demo !== true) return false
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false
  } catch {
    return false
  }
  return true
}

/** Build a Set-Cookie header value to set the (signed) demo cookie. */
export async function buildSetDemoCookieHeader(): Promise<string> {
  const value = await signDemoToken()
  const expires = new Date(Date.now() + DEMO_TOKEN_TTL * 1000).toUTCString()
  return `${DEMO_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`
}

/** Build a Set-Cookie header value to clear the demo cookie. */
export function buildClearDemoCookieHeader(): string {
  return `${DEMO_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
