// 支付宝电脑网站支付集成
// 配置见 .env: ALIPAY_APP_ID, AUTH_ALIPAY_PRIVATE_KEY, AUTH_ALIPAY_PUBLIC_KEY

import crypto from "node:crypto"

const API_BASE = "https://openapi.alipay.com/gateway.do"

// RSA2 签名
function sign(params: Record<string, string>, privateKey: string): string {
  const sorted = Object.keys(params).sort().map((k) => k + "=" + params[k]).join("&")
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(sorted, "utf8")
  return signer.sign(privateKey, "base64")
}

// 验证支付宝回调签名
export function verifyNotify(params: Record<string, string>, publicKey: string): boolean {
  const signStr = params.sign || ""
  const sorted = Object.keys(params)
    .filter((k) => k !== "sign" && k !== "sign_type")
    .sort()
    .map((k) => k + "=" + params[k])
    .join("&")
  const verifier = crypto.createVerify("RSA-SHA256")
  verifier.update(sorted, "utf8")
  return verifier.verify(publicKey, signStr, "base64")
}

// 生成订单号
export function generateOrderId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CM${ts}${rand}`
}

// 创建电脑网站支付订单
export async function createPagePay(
  orderId: string,
  subject: string,
  totalFee: number, // 元
  notifyUrl: string,
  returnUrl: string,
): Promise<string> {
  const appId = process.env.AUTH_ALIPAY_ID
  const privateKey = process.env.AUTH_ALIPAY_PRIVATE_KEY || ""

  if (!appId) throw new Error("AUTH_ALIPAY_ID 未配置")

  const bizContent = JSON.stringify({
    out_trade_no: orderId,
    product_code: "FAST_INSTANT_TRADE_PAY",
    total_amount: totalFee.toFixed(2),
    subject,
  })

  const params: Record<string, string> = {
    app_id: appId,
    method: "alipay.trade.page.pay",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
    version: "1.0",
    biz_content: bizContent,
    notify_url: notifyUrl,
    return_url: returnUrl,
  }

  params.sign = sign(params, privateKey)

  // 返回支付宝支付页面 URL（GET 请求）
  const query = new URLSearchParams(params).toString()
  return `${API_BASE}?${query}`
}

// 查询订单状态
export async function queryOrder(outTradeNo: string): Promise<{ paid: boolean; tradeNo?: string }> {
  const appId = process.env.AUTH_ALIPAY_ID
  const privateKey = process.env.AUTH_ALIPAY_PRIVATE_KEY || ""

  if (!appId) throw new Error("AUTH_ALIPAY_ID 未配置")

  const bizContent = JSON.stringify({
    out_trade_no: outTradeNo,
  })

  const params: Record<string, string> = {
    app_id: appId,
    method: "alipay.trade.query",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
    version: "1.0",
    biz_content: bizContent,
  }

  params.sign = sign(params, privateKey)

  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}?${query}`, { method: "GET" })
  const text = await res.text()

  try {
    // 支付宝返回 JSONP 格式，需要解析
    const jsonMatch = text.match(/\{.*\}/)
    if (!jsonMatch) throw new Error("无法解析支付宝响应")
    const data = JSON.parse(jsonMatch[0])
    const response = data.alipay_trade_query_response
    if (response?.trade_status === "TRADE_SUCCESS" || response?.trade_status === "TRADE_FINISHED") {
      return { paid: true, tradeNo: response.trade_no }
    }
    return { paid: false }
  } catch {
    throw new Error("查询订单失败: " + text.substring(0, 200))
  }
}

// 检查支付配置是否完整
export function isAlipayConfigured(): boolean {
  return !!(process.env.AUTH_ALIPAY_ID && process.env.AUTH_ALIPAY_PRIVATE_KEY)
}