import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

// 管理员专用：支付/系统配置状态（只显示是否已配置，不暴露真实密钥值）
// 用途：后台「支付配置」Tab，快速核对生产环境变量是否齐全。
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const mask = (v?: string) => (v ? "已配置" : "未配置")

  const config = {
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || "未配置",
    },
    creem: {
      apiKey: mask(process.env.CREEM_API_KEY),
      monthlyProductId: process.env.CREEM_MONTHLY_PRODUCT_ID || "未配置",
      annualProductId: process.env.CREEM_ANNUAL_PRODUCT_ID || "未配置",
      webhookSecret: mask(process.env.CREEM_WEBHOOK_SECRET),
    },
    alipay: {
      appId: mask(process.env.AUTH_ALIPAY_ID),
      privateKey: mask(process.env.AUTH_ALIPAY_PRIVATE_KEY),
      publicKey: mask(process.env.AUTH_ALIPAY_PUBLIC_KEY),
    },
    auth: {
      authSecret: mask(process.env.AUTH_SECRET),
      adminEmails: process.env.ADMIN_EMAILS || "未配置",
    },
    cron: {
      cronSecret: mask(process.env.CRON_SECRET),
    },
    database: {
      directUrl: mask(process.env.DIRECT_URL),
    },
  }

  return NextResponse.json({ ok: true, config })
}
