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
  const hasOwnKey = !!ownKey
  if (!hasOwnKey && !fallbackKey) {
    return { source: "未配置", key: "未配置", baseUrl: "—", model: "—" }
  }
  return {
    // source 是这一端的结论（结论先行，前端放在该块第一行）
    source: hasOwnKey ? "专用配置" : "回退默认",
    // Key 只回这两个字面值，才能命中前端 ConfigRow 的绿/红 badge；
    // 「未配置」在这里的含义是「没配这一端专属的 Key」，不代表不可用（可能正回退默认）
    key: hasOwnKey ? "已配置" : "未配置",
    // 地址与模型各自独立回落。没单独配时加「（回退默认）」标注，
    // 否则页面只显示一个值，看不出是自己填的还是从默认兜底来的。
    baseUrl: ownUrl ? ownUrl : (process.env.AI_BASE_URL || "https://api.openai.com/v1") + "（回退默认）",
    model: ownModel ? ownModel : (process.env.AI_MODEL || "未设置") + "（回退默认）",
  }
}
