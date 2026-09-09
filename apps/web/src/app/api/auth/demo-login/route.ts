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
// 计数+窗口起点结构（原实现每 IP 只存单个时间戳，count 恒为 1，限流完全不生效）
const demoRateMap = new Map<string, { count: number; resetAt: number }>()
const DEMO_RATE_LIMIT = 20
const DEMO_RATE_WINDOW = 60 * 60 * 1000 // 1 hour

export async function POST(req: Request) {
  try {
    // 基于 IP 的简单速率限制
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
    const now = Date.now()
    const hit = demoRateMap.get(ip)
    if (!hit || now > hit.resetAt) {
      demoRateMap.set(ip, { count: 1, resetAt: now + DEMO_RATE_WINDOW })
    } else {
      hit.count++
      if (hit.count > DEMO_RATE_LIMIT) {
        return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 })
      }
    }

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