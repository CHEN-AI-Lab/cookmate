// 统一订单号生成
// 格式: CK + 渠道缩写 + YYYYMMDD + 8位随机十六进制
// 示例: CKAL20240707A3F9B2C1

import crypto from "node:crypto"

const CHANNEL_PREFIX: Record<string, string> = {
  alipay: "AL",
  creem: "CR",
}

// 使用密码学安全的随机数生成器，避免订单号被猜测（原实现使用 Math.random）
function randomHex(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length).toUpperCase()
}

function todayDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

export function generateOrderId(channel: string): string {
  const prefix = CHANNEL_PREFIX[channel] || "XX"
  return `CK${prefix}${todayDate()}${randomHex(8)}`
}