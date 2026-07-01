import { NextResponse } from "next/server"

export async function GET() {
  try {
    const alipayId = process.env.AUTH_ALIPAY_ID
    const alipaySecret = process.env.AUTH_ALIPAY_SECRET
    const publicKey = process.env.ALIPAY_PUBLIC_KEY

    return NextResponse.json({
      id_configured: !!alipayId,
      secret_configured: !!alipaySecret,
      public_key_configured: !!publicKey,
      secret_length: (alipaySecret || "").length,
      secret_preview: (alipaySecret || "").substring(0, 50),
      has_header: alipaySecret?.includes("BEGIN"),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}