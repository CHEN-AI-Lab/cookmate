// ─── Subscription Utilities ───
// 订阅相关的辅助函数

/** 检查订阅是否过期，过期自动降级（按日期比较，忽略时分秒） */
export function isExpired(expiryDate: Date): boolean {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setUTCHours(0, 0, 0, 0)
  return now > expiry
}