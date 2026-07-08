// 统一订单号生成
// 格式: CK + 渠道缩写 + YYYYMMDD + 8位随机十六进制
// 示例: CKAL20240707A3F9B2C1

const CHANNEL_PREFIX: Record<string, string> = {
  alipay: "AL",
  creem: "CR",
  stripe: "ST",
}

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join("")
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