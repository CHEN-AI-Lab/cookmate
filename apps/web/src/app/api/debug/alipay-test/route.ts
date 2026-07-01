import { NextResponse } from "next/server"
import crypto from "node:crypto"

function pemHeader(kind: string): string {
  return "-----BEGIN " + kind + " PRIVATE KEY-----"
}

function pemFooter(kind: string): string {
  return "-----END " + kind + " PRIVATE KEY-----"
}

export async function GET() {
  try {
    const raw = process.env.AUTH_ALIPAY_SECRET || ""
    const hPkcs1 = pemHeader("RSA")
    const hPkcs8 = pemHeader("")
    const fPkcs1 = pemFooter("RSA")
    const fPkcs8 = pemFooter("")

    const hasPkcs1 = raw.includes(hPkcs1)
    const hasPkcs8 = raw.includes(hPkcs8)
    const hasFooter = raw.includes(fPkcs1) || raw.includes(fPkcs8)

    let keyTest = "未测试（无PEM头）"
    if (hasPkcs1 || hasPkcs8) {
      try {
        const s = crypto.createSign("RSA-SHA256")
        s.update("test", "utf8")
        const sig = s.sign(raw, "base64")
        keyTest = "签名可用，长度: " + sig.length
      } catch (e: any) {
        keyTest = "签名失败: " + e.message
      }
    }

    // 检查是否是纯 base64（无头无尾）
    const base64Only = /^[A-Za-z0-9+/=]+$/.test(raw.trim())

    return NextResponse.json({
      length: raw.length,
      starts_with: raw.substring(0, 60),
      has_rsa_header: hasPkcs1,
      has_pkcs8_header: hasPkcs8,
      has_footer: hasFooter,
      is_pure_base64: base64Only,
      key_test: keyTest,
      hint: (hasPkcs1 || hasPkcs8) ? "" : (base64Only ? "密钥是纯 base64！需要加上 PEM 头尾标记" : "密钥格式未知"),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}