import { NextResponse } from "next/server"
import crypto from "node:crypto"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authCode = searchParams.get("auth_code") || "b5f09d46046f4577a37db1f5b03eIB57"

  const appId = process.env.AUTH_ALIPAY_ID
  const rawKey = process.env.AUTH_ALIPAY_SECRET || ""

  // 整理私钥：处理 Vercel env 中可能存在的 \n 字面量
  const privateKey = rawKey.replace(/\\n/g, "\n")

  const result: any = {
    appId_configured: !!appId,
    rawKey_has_value: rawKey.length > 0,
    rawKey_starts_with: rawKey.substring(0, 40),
    rawKey_has_literal_n: rawKey.includes("\\n"),
    privateKey_has_newlines: privateKey.includes("\n"),
    auth_code: authCode.substring(0, 10) + "...",
  }

  // 测试1：检查私钥是否能被 crypto 解析
  try {
    const signer = crypto.createSign("RSA-SHA256")
    signer.update("test", "utf8")
    const sig = signer.sign(privateKey, "base64")
    result.key_test = "✅ 私钥可用，签名长度: " + sig.length
  } catch (e: any) {
    result.key_test = "❌ 私钥不可用: " + e.message
  }

  if (!appId || !privateKey) {
    result.error = "环境变量未配置"
    return NextResponse.json(result)
  }

  // 测试2：实际调支付宝 token 接口
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

  result.timestamp_sent = timestamp
  result.params_sorted = Object.keys(params).sort()

  try {
    const body = new URLSearchParams(params)
    const res = await fetch("https://openapi.alipay.com/gateway.do", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: body.toString(),
    })
    const text = await res.text()
    try { result.alipay_response = JSON.parse(text) } catch { result.alipay_response = { raw: text } }

    if (result.alipay_response?.error_response) {
      const e = result.alipay_response.error_response
      result.error_analysis = `支付宝错误: ${e.msg} (${e.code})${e.sub_msg ? " - " + e.sub_msg : ""}`
    } else if (result.alipay_response?.alipay_system_oauth_token_response?.access_token) {
      result.success = "✅ 成功了！"
    }
  } catch (e: any) {
    result.network_error = e.message
  }

  return NextResponse.json(result)
}