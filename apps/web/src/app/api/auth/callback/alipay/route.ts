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
      return NextResponse.redirect(new URL("/login?error=token_failed", req.url))
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
    if (!profile?.userId) {
      return NextResponse.redirect(new URL("/login?error=userinfo_failed", req.url))
    }

    // Step 3: 查找或创建用户（用支付宝 userId 作为标识）
    const alipayUserId = profile.userId
    const alipayNick = profile.nickName || "支付宝用户"

    // 先在 Account 表找是否已有绑定
    const existingAccount = await prisma.account.findFirst({
      where: { provider: "alipay", providerAccountId: alipayUserId },
    })

    let userId: string
    if (existingAccount) {
      userId = existingAccount.userId
    } else {
      // 创建新用户
      const newUser = await prisma.user.create({
        data: { name: alipayNick },
      })
      userId = newUser.id
      // 绑定 Account 记录
      await prisma.account.create({
        data: {
          userId,
          type: "oauth",
          provider: "alipay",
          providerAccountId: alipayUserId,
        },
      })
    }

    // Step 4: 通过 credential provider 登录
    const { signIn } = await import("@/lib/auth")
    await signIn("alipay-auth", {
      userId,
      redirect: false,
    })

    // Step 5: 重定向到仪表盘
    return NextResponse.redirect(new URL("/app/dashboard", req.url))
  } catch (err: any) {
    console.error("[Alipay Callback] Error:", err)
    return NextResponse.redirect(new URL("/login?error=alipay_error", req.url))
  }
}