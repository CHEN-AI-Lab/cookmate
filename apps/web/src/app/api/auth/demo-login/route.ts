/**
 * Demo login — sets a cookie instead of creating a NextAuth session.
 *
 * This replaces the old Credentials provider with id: "demo".
 * By using a separate cookie, we prevent the demo user from being
 * linked to real OAuth accounts through NextAuth's session mechanism.
 */
import { NextResponse } from "next/server"
import { buildSetDemoCookieHeader, DEMO_SESSION } from "@cookmate/shared/utils/demo-cookie"

// 简单的内存速率限制：同一 IP 每小时最多 20 次
const demoRateMap = new Map<string, number>()
const DEMO_RATE_LIMIT = 20
const DEMO_RATE_WINDOW = 60 * 60 * 1000 // 1 hour

export async function POST(req: Request) {
  try {
    // 基于 IP 的简单速率限制
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const now = Date.now()
    const last = demoRateMap.get(ip) || 0
    if (last > now - DEMO_RATE_WINDOW) {
      const count = [...demoRateMap.entries()].filter(([k, v]) => k === ip && v > now - DEMO_RATE_WINDOW).length
      if (count >= DEMO_RATE_LIMIT) {
        return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 })
      }
    }
    demoRateMap.set(ip, now)

    const headers = new Headers()
    headers.append("Set-Cookie", await buildSetDemoCookieHeader())

    return NextResponse.json(
      { success: true, user: DEMO_SESSION.user },
      { headers }
    )
  } catch (error) {
    console.error("Demo login error:", error)
    return NextResponse.json({ error: "登录失败" }, { status: 500 })
  }
}