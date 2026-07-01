import { NextResponse } from "next/server"
import crypto from "node:crypto"

function signParams(params: Record<string, string>, privateKey: string): string {
  const sorted = Object.keys(params).sort().map((k) => k + "=" + params[k]).join("&")
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(sorted, "utf8")
  return signer.sign(privateKey, "base64")
}

export async function GET() {
  const appId = process.env.AUTH_ALIPAY_ID
  const privateKey = process.env.AUTH_ALIPAY_SECRET
  const publicKey = process.env.ALIPAY_PUBLIC_KEY

  if (!appId) return NextResponse.json({ error: "AUTH_ALIPAY_ID 未配置" })
  if (!privateKey) return NextResponse.json({ error: "AUTH_ALIPAY_SECRET 未配置" })

  // 测试1：用假 auth_code 调支付宝 API，看返回什么错误
  const testCode = "test_auth_code_2026"
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
    code: testCode,
  }
  params.sign = signParams(params, privateKey)

  const body = new URLSearchParams(params)

  let alipayResponse: any = null
  let error = null

  try {
    const res = await fetch("https://openapi.alipay.com/gateway.do", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: body.toString(),
    })
    const text = await res.text()
    try { alipayResponse = JSON.parse(text) } catch { alipayResponse = { raw: text } }
  } catch (e: any) {
    error = e.message
  }

  // 构建结果
  const result: any = {
    appId_configured: !!appId,
    privateKey_configured: !!privateKey,
    publicKey_configured: !!publicKey,
    private_key_length: privateKey?.length || 0,
    private_key_format: privateKey?.startsWith("-----BEGIN RSA PRIVATE KEY-----") ? "PKCS1" :
      privateKey?.startsWith("-----BEGIN PRIVATE KEY-----") ? "PKCS8" : "未知格式",
    timestamp_sent: timestamp,
    alipay_response: alipayResponse,
    error,
  }

  // 如果支付宝返回了错误，加一份中文说明
  if (alipayResponse?.error_response) {
    const err = alipayResponse.error_response
    result.error_analysis = `支付宝返回错误: ${err.msg} (${err.code})${err.sub_msg ? ` - ${err.sub_msg}` : ""}`
  } else if (alipayResponse?.alipay_system_oauth_token_response?.access_token) {
    result.success = "✅ 假的 auth_code 居然返回了 token，说明 API 通讯正常"
  }

  return NextResponse.json(result)
}