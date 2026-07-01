import { NextResponse } from "next/server"
import crypto from "node:crypto"

function signParams(params: Record<string, string>, privateKey: string): string {
  const sorted = Object.keys(params).sort().map((k) => k + "=" + params[k]).join("&")
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(sorted, "utf8")
  return signer.sign(privateKey, "base64")
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authCode = searchParams.get("auth_code")
  if (!authCode) {
    return NextResponse.json({ error: "缺少 auth_code 参数。请访问支付宝登录页面授权后，查看浏览器地址栏中的 auth_code" })
  }

  const appId = process.env.AUTH_ALIPAY_ID
  const privateKey = process.env.AUTH_ALIPAY_SECRET
  const publicKey = process.env.ALIPAY_PUBLIC_KEY

  if (!appId || !privateKey) {
    return NextResponse.json({ error: "支付宝未配置" })
  }

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

  // 打印签名前的字符串
  const signStr = Object.keys(params).sort().map((k) => k + "=" + params[k]).join("&")

  params.sign = signParams(params, privateKey)

  const body = new URLSearchParams(params)

  const res = await fetch("https://openapi.alipay.com/gateway.do", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: body.toString(),
  })

  const text = await res.text()

  let parsed: any
  try { parsed = JSON.parse(text) } catch { parsed = { raw: text } }

  // 验证签名
  let verifyResult = "跳过（无支付宝公钥）"
  if (publicKey && parsed.alipay_system_oauth_token_response && parsed.sign) {
    const verifyStr = Object.keys(parsed.alipay_system_oauth_token_response).sort()
      .map((k) => k + "=" + parsed.alipay_system_oauth_token_response[k]).join("&")
    const verifier = crypto.createVerify("RSA-SHA256")
    verifier.update(verifyStr, "utf8")
    verifyResult = verifier.verify(publicKey, parsed.sign, "base64") ? "✅ 通过" : "❌ 失败"
  }

  // 返回详细诊断信息
  return NextResponse.json({
    auth_code_received: authCode.substring(0, 10) + "...",
    timestamp_sent: timestamp,
    alipay_response: parsed,
    signature_verify: verifyResult,
    params_sorted: Object.keys(params).sort(),
    sign_string_preview: signStr.substring(0, 100) + "...",
  })
}