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
    ai: {
      free: aiSide(process.env.AI_API_KEY_FREE, process.env.AI_BASE_URL_FREE, process.env.AI_MODEL_FREE),
      pro: aiSide(process.env.AI_API_KEY_PRO, process.env.AI_BASE_URL_PRO, process.env.AI_MODEL_PRO),
      fallback: {
        key: mask(process.env.AI_API_KEY || process.env.OPENAI_API_KEY),
        baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
        model: process.env.AI_MODEL || "未设置",
      },
    },
  }

  return NextResponse.json({ ok: true, config })
}

/**
 * 按订阅层级核对某一端（免费/付费）的 AI 配置。
 * Key 只回「已配置 / 未配置」，绝不回传原文；接口地址与模型回实际生效值，便于核对是否填对。
 * 该端自身没配 Key 时，会回落到默认 AI_* —— 用 source 标明实际来源。
 */
function aiSide(ownKey?: string, ownUrl?: string, ownModel?: string) {
  const fallbackKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  const effectiveKey = ownKey || fallbackKey
  if (!effectiveKey) {
    return { key: "未配置", source: "未配置", baseUrl: "—", model: "—" }
  }
  return {
    key: ownKey ? "已配置" : "未配置（用默认 Key）",
    source: ownKey ? "专用" : "回落默认",
    baseUrl: ownUrl || process.env.AI_BASE_URL || "https://api.openai.com/v1",
    model: ownModel || process.env.AI_MODEL || "未设置",
  }
}
