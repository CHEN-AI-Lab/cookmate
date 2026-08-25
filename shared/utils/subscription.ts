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

/**
 * 给定日期加 N 个月，自动处理月底越界。
 *
 * 例：1月31日 + 1月 → 2月28/29日（不是3月3日）
 * 算法：先尝试 setUTCMonth(month + n)，若结果日 < 原始日（如 Jan 31 → Mar 3，日变成3），
 *      说明溢出了，把日设为目标月最后一天（设为 0 = 上月最后一天）。
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const originalDay = result.getUTCDate()
  result.setUTCMonth(result.getUTCMonth() + months)
  // 月底越界检测：日回退到原始日之前 → 目标月没有这一天
  if (result.getUTCDate() < originalDay) {
    // 回退到目标月最后一天：先设为下月1日，再 -1 天
    result.setUTCDate(0)
  }
  return result
}

/**
 * 给定日期加 N 年，自动处理闰年越界（2月29日 + 1年 → 2月28日）。
 * 实现复用 addMonths(12 * years)，addMonths 已处理月底越界。
 */
export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12)
}