// 支付宝登录回调 — 仅获取用户信息，重定向到客户端自动登录
import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"

interface AlipayTokenResponse {
  alipay_system_oauth_token_response?: { access_token: string; user_id: string }
  error_response?: { msg: string; sub_msg?: string; code: string }
}
interface AlipayUserInfoResponse {
  alipay_user_info_share_response?: { user_id: string; open_id?: string; userId?: string; nick_name: string; nickName?: string; avatar: string }
  error_response?: { msg: string; sub_msg?: string }
}

function signParams(params: Record<string, string>, key: string): string {
  const sorted = Object.keys(params).sort().map(k => k + "=" + params[k]).join("&")
  return crypto.createSign("RSA-SHA256").update(sorted, "utf8").sign(key.replace(/\\n/g, "\n"), "base64")
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const authCode = url.searchParams.get("auth_code") || url.searchParams.get("code")
  if (!authCode) return NextResponse.redirect(new URL("/login?error=no_code", req.url))

  const appId = process.env.AUTH_ALIPAY_ID
  const privateKey = process.env.AUTH_ALIPAY_PRIVATE_KEY || ""
  if (!appId || !privateKey) return NextResponse.redirect(new URL("/login?error=alipay_not_configured", req.url))

  try {
    // Step 1: Token exchange
    const d = new Date(); d.setHours(d.getHours() + 8)
    const ts = d.toISOString().replace("T", " ").replace(/\..+/, "")
    const p: Record<string, string> = {
      app_id: appId, method: "alipay.system.oauth.token",
      format: "JSON", charset: "utf-8", sign_type: "RSA2",
      timestamp: ts, version: "1.0",
      grant_type: "authorization_code", code: authCode,
    }
    p.sign = signParams(p, privateKey)
    let res: Response | null = null
    const maxRetries = 2
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        res = await fetch("https://openapi.alipay.com/gateway.do", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
          body: new URLSearchParams(p).toString(),
          signal: AbortSignal.timeout(30000),
        })
        break
      } catch (fetchErr) {
        if (attempt < maxRetries) {
          console.error(`[Alipay Callback] Fetch attempt ${attempt + 1} failed, retrying...`)
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
          continue
        }
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
        console.error("[Alipay Callback] Fetch failed after retries:", msg)
        return NextResponse.redirect(new URL("/login?error=alipay_network&detail=" + encodeURIComponent(msg), req.url))
      }
    }
    if (!res) {
      return NextResponse.redirect(new URL("/login?error=alipay_network", req.url))
    }
    const tokenData: AlipayTokenResponse = JSON.parse(await res.text())
    const accessToken = tokenData.alipay_system_oauth_token_response?.access_token
    if (!accessToken) {
      const errMsg = tokenData.error_response?.sub_msg || tokenData.error_response?.msg || JSON.stringify(tokenData).substring(0, 200)
      return NextResponse.redirect(new URL("/login?error=token_failed&detail=" + encodeURIComponent(errMsg), req.url))
    }

    // Step 2: User info
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
      signal: AbortSignal.timeout(30000),
    })
    const userData: AlipayUserInfoResponse = JSON.parse(await uRes.text())
    const profile = userData.alipay_user_info_share_response
    const alipayUserId = profile?.open_id || profile?.userId || profile?.user_id
    if (!alipayUserId) {
      const errMsg = userData.error_response?.sub_msg || userData.error_response?.msg || JSON.stringify(userData).substring(0, 200)
      return NextResponse.redirect(new URL("/login?error=userinfo_failed&detail=" + encodeURIComponent(errMsg), req.url))
    }

    // Step 3: Find or create user
    const alipayNick = profile.nickName || "支付宝用户"
    const existingAccount = await prisma.account.findFirst({
      where: { provider: "alipay", providerAccountId: alipayUserId },
    })

    let userId: string
    if (existingAccount) {
      userId = existingAccount.userId
    } else {
      const newUser = await prisma.user.create({ data: { name: alipayNick, termsAgreedAt: new Date() } })
      await prisma.account.create({
        data: { userId: newUser.id, type: "oauth", provider: "alipay", providerAccountId: alipayUserId },
      })
      userId = newUser.id
    }

    // Step 4: 重定向到登录页，参数传递给前端自动登录
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("alipay_auth", userId)
    return NextResponse.redirect(loginUrl)
  } catch (err: unknown) {
    console.error("[Alipay Callback] Error:", err)
    if (err instanceof Error) console.error("[Alipay Callback]", err.message || err)
    return NextResponse.redirect(new URL("/login?error=alipay_error", req.url))
  }
}