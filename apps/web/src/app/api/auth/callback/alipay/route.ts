// 支付宝登录回调 — 手动处理，绕过 NextAuth 的 OAuth handler
import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"

// 复制 signParams 避免 import 依赖
function signParams(params: Record<string, string>, key: string): string {
  const sorted = Object.keys(params).sort().map(k => k + "=" + params[k]).join("&")
  return crypto.createSign("RSA-SHA256").update(sorted, "utf8").sign(key.replace(/\\n/g, "\n"), "base64")
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const authCode = url.searchParams.get("auth_code") || url.searchParams.get("code")
  if (!authCode) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url))
  }

  const appId = process.env.AUTH_ALIPAY_ID
  const privateKey = process.env.AUTH_ALIPAY_SECRET || ""
  if (!appId || !privateKey) {
    return NextResponse.redirect(new URL("/login?error=alipay_not_configured", req.url))
  }

  try {
    // Step 1: 获取 access_token
    const d = new Date(); d.setHours(d.getHours() + 8)
    const ts = d.toISOString().replace("T", " ").replace(/\..+/, "")
    const p: Record<string, string> = {
      app_id: appId, method: "alipay.system.oauth.token",
      format: "JSON", charset: "utf-8", sign_type: "RSA2",
      timestamp: ts, version: "1.0",
      grant_type: "authorization_code", code: authCode,
    }
    p.sign = signParams(p, privateKey)
    const res = await fetch("https://openapi.alipay.com/gateway.do", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams(p).toString(),
    })
    const tokenData = JSON.parse(await res.text())
    const accessToken = tokenData.alipay_system_oauth_token_response?.access_token
    if (!accessToken) {
      const errMsg = tokenData.error_response?.sub_msg || tokenData.error_response?.msg || JSON.stringify(tokenData).substring(0, 200)
      return NextResponse.redirect(new URL("/login?error=token_failed&detail=" + encodeURIComponent(errMsg), req.url))
    }

    // Step 2: 获取用户信息
    const d2 = new Date(); d2.setHours(d2.getHours() + 8)
    const ts2 = d2.toISOString().replace("T", " ").replace(/\..+/, "")
    const up: Record<string, string> = {
      app_id: appId, method: "alipay.user.info.share",
      format: "JSON", charset: "utf-8", sign_type: "RSA2",
      timestamp: ts2, version: "1.0",
      auth_token: accessToken,
    }
    up.sign = signParams(up, privateKey)
    const uRes = await fetch("https://openapi.alipay.com/gateway.do", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams(up).toString(),
    })
    const userData = JSON.parse(await uRes.text())
    const profile = userData.alipay_user_info_share_response
    const alipayUserId = profile?.open_id || profile?.userId || profile?.user_id
    if (!alipayUserId) {
      const errMsg = userData.error_response?.sub_msg || userData.error_response?.msg || JSON.stringify(userData).substring(0, 200)
      return NextResponse.redirect(new URL("/login?error=userinfo_failed&detail=" + encodeURIComponent(errMsg), req.url))
    }

    // Step 3: 查找或创建用户
    const alipayNick = profile.nickName || "支付宝用户"
    const existingAccount = await prisma.account.findFirst({
      where: { provider: "alipay", providerAccountId: alipayUserId },
    })

    let userId: string
    let userName: string | null
    let userEmail: string | null
    let userImage: string | null

    if (existingAccount) {
      const user = await prisma.user.findUnique({ where: { id: existingAccount.userId } })
      userId = existingAccount.userId
      userName = user?.name || null
      userEmail = user?.email || null
      userImage = user?.image || null
    } else {
      const newUser = await prisma.user.create({
        data: { name: alipayNick },
      })
      await prisma.account.create({
        data: {
          userId: newUser.id, type: "oauth", provider: "alipay",
          providerAccountId: alipayUserId,
        },
      })
      userId = newUser.id
      userName = newUser.name
      userEmail = null
      userImage = null
    }

    // Step 4: 直接用 JWT 创建 session（替代 signIn，因为 signIn 有时返回 Response 有时不返回）
    // 用 jose (Next.js 已依赖) 签发一个 JWT
    const { SignJWT } = await import("jose")
    const secret = process.env.AUTH_SECRET
    if (!secret) return NextResponse.redirect(new URL("/login?error=alipay_error", req.url))

    const now = Math.floor(Date.now() / 1000)
    const token = await new SignJWT({
      sub: userId,
      name: userName,
      email: userEmail,
      picture: userImage,
      iat: now,
      exp: now + 30 * 24 * 3600, // 30 天
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode(secret))

    // Step 5: 重定向并设置 session cookie
    const dashboard = new URL("/app/dashboard", req.url)
    const response = NextResponse.redirect(dashboard)
    response.cookies.set("authjs.session-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 3600,
    })

    return response
  } catch (err: any) {
    console.error("[Alipay Callback] Error:", err)
    return NextResponse.redirect(new URL("/login?error=alipay_error", req.url))
  }
}