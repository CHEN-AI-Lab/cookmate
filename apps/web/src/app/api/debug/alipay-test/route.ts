import { NextResponse } from "next/server"
import crypto from "node:crypto"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authCode = searchParams.get("auth_code")

  const appId = process.env.AUTH_ALIPAY_ID
  const privateKey = process.env.AUTH_ALIPAY_SECRET || ""
  const publicKey = process.env.ALIPAY_PUBLIC_KEY || ""

  const result: any = {
    private_key_ok: privateKey.includes("[REDACTED PRIVATE KEY]"),
    app_id: appId ? appId.substring(0, 8) + "..." : "未配置",
  }

  if (!authCode) {
    result.instruction = "请在 URL 后面加上 ?auth_code=你的授权码"
    result.instruction += "\n获取方式：点支付宝登录 → 扫码授权 → 浏览器被跳转到错误页 → 查看地址栏（需要快速复制，或看 Network 面板）"
    return NextResponse.json(result)
  }

  if (!appId || !privateKey.includes("BEGIN")) {
    result.error = "环境变量未配置完整"
    return NextResponse.json(result)
  }

  // 调支付宝 token 接口
  const d = new Date()
  d.setHours(d.getHours() + 8)
  const timestamp = d.toISOString().replace('T', ' ').replace(/\..+/, '')

  const params: Record<string, string> = {
    app_id: appId,
    method: "alipay.system.oauth.token",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp,
    version: "1.0",
    grant_type: "authorization_code",
    code: authCode,
  }
  params.sign = crypto.createSign("RSA-SHA256")
    .update(Object.keys(params).sort().map(k => k + "=" + params[k]).join("&"), "utf8")
    .sign(privateKey, "base64")

  result.timestamp = timestamp
  result.params_count = Object.keys(params).length

  try {
    const body = new URLSearchParams(params)
    const res = await fetch("https://openapi.alipay.com/gateway.do", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: body.toString(),
    })
    const text = await res.text()
    result.alipay_response = (() => { try { return JSON.parse(text) } catch { return { raw: text } } })()

    const resp = result.alipay_response
    if (resp?.alipay_system_oauth_token_response?.access_token) {
      result.status = "✅ Token 获取成功！"
      // 继续调 userinfo
      const ut = new Date()
      ut.setHours(ut.getHours() + 8)
      const uts = ut.toISOString().replace('T', ' ').replace(/\..+/, '')
      const up: Record<string, string> = {
        app_id: appId,
        method: "alipay.user.info.share",
        format: "JSON", charset: "utf-8", sign_type: "RSA2",
        timestamp: uts, version: "1.0",
        auth_token: resp.alipay_system_oauth_token_response.access_token,
      }
      up.sign = crypto.createSign("RSA-SHA256")
        .update(Object.keys(up).sort().map(k => k + "=" + up[k]).join("&"), "utf8")
        .sign(privateKey, "base64")

      const ub = new URLSearchParams(up)
      const ur = await fetch("https://openapi.alipay.com/gateway.do", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
        body: ub.toString(),
      })
      const utxt = await ur.text()
      result.userinfo_response = (() => { try { return JSON.parse(utxt) } catch { return { raw: utxt } } })()
    } else if (resp?.error_response) {
      const e = resp.error_response
      result.status = `❌ 支付宝返回错误: ${e.msg} (${e.code})${e.sub_msg ? " - " + e.sub_msg : ""}`
    } else {
      result.status = "❌ 未知响应"
    }
  } catch (e: any) {
    result.network_error = e.message
  }

  return NextResponse.json(result)
}