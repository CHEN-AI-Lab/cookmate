// 支付抽象层 — 支持 PayJS 等国内支付网关
// 配置见 .env: PAYJS_MCHID, PAYJS_KEY, PAYJS_NOTIFY_URL

const PAYJS_API = "https://payjs.cn/api"

interface PayJSCreateParams {
  mchid: string
  total_fee: number       // 单位：分
  out_trade_no: string
  body: string
  notify_url: string
  sign: string
}

interface PayJSResponse {
  return_code: number     // 1=成功, 0=失败
  return_msg: string
  out_trade_no: string
  payjs_order_id: string
  code_url: string        // 二维码内容（支付地址）
  qrcode: string          // 二维码 base64 图片
  expires_in: number
}

interface PayJSQueryResponse {
  return_code: number
  return_msg: string
  out_trade_no: string
  payjs_order_id: string
  transaction_id: string
  total_fee: number
  paid_ok: boolean        // true=已支付
}

// 获取支付配置状态
export function isPaymentConfigured(): boolean {
  return !!(process.env.PAYJS_MCHID && process.env.PAYJS_KEY)
}

// MD5 签名（PayJS 要求）
export function sign(params: Record<string, string | number>, key: string): string {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] !== undefined && k !== "sign")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&") + `&key=${key}`
  // Node.js crypto MD5
  const crypto = require("crypto")
  return crypto.createHash("md5").update(sorted).digest("hex").toUpperCase()
}

// 生成订单号
export function generateOrderId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CM${ts}${rand}`
}

// 创建支付订单
// channel: "wechat" | "alipay"
export async function createPaymentOrder(
  channel: "wechat" | "alipay",
  totalFee: number,       // 元
  body: string,
  outTradeNo: string
): Promise<{ codeUrl: string; payjsOrderId: string }> {
  const mchid = process.env.PAYJS_MCHID
  const key = process.env.PAYJS_KEY
  const notifyUrl = process.env.PAYJS_NOTIFY_URL || (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001") + "/api/payment/notify"

  if (!mchid || !key) {
    throw new Error("支付系统未配置")
  }

  const params: Record<string, string | number> = {
    mchid,
    total_fee: Math.round(totalFee * 100),  // 转分
    out_trade_no: outTradeNo,
    body,
    notify_url: notifyUrl,
  }

  params.sign = sign(params, key)

  const endpoint = channel === "alipay" ? "/alipay/native" : "/native"

  const res = await fetch(`${PAYJS_API}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params as any).toString(),
  })

  const data: PayJSResponse = await res.json()

  if (data.return_code !== 1) {
    throw new Error(data.return_msg || "创建支付订单失败")
  }

  return { codeUrl: data.code_url, payjsOrderId: data.payjs_order_id }
}

// 查询订单支付状态
export async function queryPaymentOrder(payjsOrderId: string): Promise<{ paid: boolean }> {
  const mchid = process.env.PAYJS_MCHID
  const key = process.env.PAYJS_KEY

  if (!mchid || !key) {
    throw new Error("支付系统未配置")
  }

  const params: Record<string, string | number> = {
    payjs_order_id: payjsOrderId,
    mchid,
  }
  params.sign = sign(params, key)

  const res = await fetch(`${PAYJS_API}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params as any).toString(),
  })

  const data: PayJSQueryResponse = await res.json()

  if (data.return_code !== 1) {
    throw new Error(data.return_msg || "查询订单失败")
  }

  return { paid: data.paid_ok }
}