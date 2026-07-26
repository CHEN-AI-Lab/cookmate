/**
 * Demo login — sets a cookie instead of creating a NextAuth session.
 *
 * This replaces the old Credentials provider with id: "demo".
 * By using a separate cookie, we prevent the demo user from being
 * linked to real OAuth accounts through NextAuth's session mechanism.
 */
import { NextResponse } from "next/server"
import { buildSetDemoCookieHeader, DEMO_SESSION } from "@/lib/demo-cookie"

export async function POST() {
  try {
    const headers = new Headers()
    headers.append("Set-Cookie", buildSetDemoCookieHeader())

    return NextResponse.json(
      { success: true, user: DEMO_SESSION.user },
      { headers }
    )
  } catch (error) {
    console.error("Demo login error:", error)
    return NextResponse.json({ error: "登录失败" }, { status: 500 })
  }
}