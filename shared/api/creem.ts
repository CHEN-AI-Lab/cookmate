// Creem 支付集成
// 文档: https://docs.creem.io
// 环境变量: CREEM_API_KEY, CREEM_PRODUCT_ID, CREEM_WEBHOOK_SECRET

import crypto from "node:crypto"

const CREEM_API = "https://api.creem.io/v1"

function getHeaders(): Record<string, string> {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) throw new Error("CREEM_API_KEY 未配置")
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  }
}

// 创建结账会话
export async function createCheckout(params: {
  productId?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const productId = params.productId || process.env.CREEM_PRODUCT_ID
  if (!productId) throw new Error("CREEM_PRODUCT_ID 未配置")

  const body = {
    product_id: productId,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata || {},
  }

  const res = await fetch(`${CREEM_API}/checkout`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Creem checkout failed: ${res.status} ${text.substring(0, 200)}`)
  }

  const data = await res.json()
  return {
    checkoutUrl: data.checkout_url || data.url,
    sessionId: data.id || data.session_id,
  }
}

// 验证 Webhook 签名
export function verifyWebhook(payload: string, signature: string): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET
  if (!secret) return false

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// 检查支付配置是否完整
export function isCreemConfigured(): boolean {
  return !!(process.env.CREEM_API_KEY && process.env.CREEM_PRODUCT_ID)
}