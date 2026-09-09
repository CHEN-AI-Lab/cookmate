// Creem 支付集成
// 文档: https://docs.creem.io
// 环境变量: CREEM_API_KEY, CREEM_PRODUCT_ID, CREEM_WEBHOOK_SECRET

import type crypto from "node:crypto"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeCrypto = require("node:crypto") as typeof crypto

// 测试 key 前缀 creem_test_，测试环境 API URL 不同
function getBaseUrl(): string {
  const apiKey = process.env.CREEM_API_KEY
  if (apiKey?.startsWith("creem_test_")) {
    return "https://test-api.creem.io/v1"
  }
  return "https://api.creem.io/v1"
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) throw Object.assign(new Error("CREEM_API_KEY 未配置"), { code: "CREEM_NOT_CONFIGURED" })
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "x-api-key": apiKey,
  }
}

// 创建结账会话
export async function createCheckout(params: {
  productId?: string
  successUrl: string
  metadata?: Record<string, string>
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const productId = params.productId || process.env.CREEM_PRODUCT_ID
  if (!productId) throw Object.assign(new Error("CREEM_PRODUCT_ID 未配置"), { code: "CREEM_NOT_CONFIGURED" })

  const body: Record<string, unknown> = {
    product_id: productId,
    success_url: params.successUrl,
  }

  if (params.metadata && Object.keys(params.metadata).length > 0) {
    body.metadata = params.metadata
  }

  const res = await fetch(`${getBaseUrl()}/checkouts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(new Error("Creem checkout failed"), { code: "CREEM_CHECKOUT_FAILED", statusCode: res.status, details: text.substring(0, 200) })
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

  const expected = nodeCrypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  try {
    return nodeCrypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    // 长度不匹配时 timingSafeEqual 会 throw RangeError
    return false
  }
}

// 检查支付配置是否完整
export function isCreemConfigured(): boolean {
  return !!(process.env.CREEM_API_KEY && (process.env.CREEM_PRODUCT_ID || process.env.CREEM_MONTHLY_PRODUCT_ID || process.env.CREEM_ANNUAL_PRODUCT_ID))
}

// 查询 checkout 状态
export async function retrieveCheckout(checkoutId: string): Promise<{ status: string; metadata?: Record<string, unknown> }> {
  const res = await fetch(`${getBaseUrl()}/checkouts/${checkoutId}`, {
    method: "GET",
    headers: getHeaders(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(new Error("Creem retrieve checkout failed"), { code: "CREEM_RETRIEVE_FAILED", statusCode: res.status, details: text.substring(0, 200) })
  }

  return res.json()
}

// 取消订阅（立即取消，不计入下个周期）
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ mode: "immediate" }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(new Error("Creem cancel subscription failed"), { code: "CREEM_CANCEL_FAILED", statusCode: res.status, details: text.substring(0, 200) })
  }
}
