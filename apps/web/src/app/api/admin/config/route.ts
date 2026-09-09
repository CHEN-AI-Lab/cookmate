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

  // 默认兜底 Key：与其他 Key 行保持同一套语义（有=绿，无=红）
  const fallbackAiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY

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
        key: { text: mask(fallbackAiKey), tone: fallbackAiKey ? ("ok" as const) : ("error" as const) },
        baseUrl: { text: process.env.AI_BASE_URL || "https://api.openai.com/v1", fromDefault: false },
        model: { text: process.env.AI_MODEL || "未设置", fromDefault: false },
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

  // 完全没得用：连默认兜底都没有
  if (!hasOwnKey && !fallbackKey) {
    return {
      source: { text: "未配置", tone: "error" as const },
      key: { text: "未配置", tone: "error" as const },
      model: { text: "—", fromDefault: false },
      baseUrl: { text: "—", fromDefault: false },
    }
  }

  // 来源与专用 Key 描述的是同一件事的两个视角，颜色保持一致：
  // 用了专属配置=绿，回退到默认=琥珀（功能正常但需注意），真没配=红
  const tone = hasOwnKey ? ("ok" as const) : ("warn" as const)
  return {
    source: { text: hasOwnKey ? "专用配置" : "回退默认", tone },
    key: { text: hasOwnKey ? "已配置" : "未配置 · 用默认", tone },
    model: {
      text: ownModel || process.env.AI_MODEL || "未设置",
      fromDefault: !ownModel,
    },
    baseUrl: {
      text: ownUrl || process.env.AI_BASE_URL || "https://api.openai.com/v1",
      fromDefault: !ownUrl,
    },
  }
}
