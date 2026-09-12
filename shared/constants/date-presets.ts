// 日期区间预设 —— 后台筛选统一走这里，禁止各页面自己算。
//
// 设计依据（2026-09-11 调研）：
//   - AWS Cloudscape：不需要自定义区间时就不要用日期区间选择器，预设够用
//   - FreeAgent Date Filter Dropdown：常用区间的快捷入口 + 标注它对应的具体日期
//   - UX Patterns：Preset Selector —— 选得快、不用日历、没有格式困惑
// 用户明确反馈原生日期控件「非常难用」，所以预设是主路径，日期控件只作兜底。

export const DATE_PRESET_KEYS = ["today", "7d", "30d", "month", "custom"] as const

export type DatePresetKey = (typeof DATE_PRESET_KEYS)[number]

/** 本地日区间（YYYY-MM-DD） */
export interface DateRange {
  from: string
  to: string
  /** 来源预设，仅用于界面回显高亮；custom 或直接给日期时为空 */
  preset?: DatePresetKey
}

/** Date → 本地 YYYY-MM-DD */
export function toYmd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * 预设 → 具体本地日区间。custom 返回 null（由调用方给具体起止）。
 * now 可注入，便于测试。
 */
export function presetToRange(preset: DatePresetKey, now: Date = new Date()): DateRange | null {
  const to = toYmd(now)
  if (preset === "today") return { from: to, to }
  if (preset === "7d" || preset === "30d") {
    const s = new Date(now.getTime())
    s.setDate(s.getDate() - (preset === "7d" ? 6 : 29))
    return { from: toYmd(s), to }
  }
  if (preset === "month") return { from: toYmd(new Date(now.getFullYear(), now.getMonth(), 1)), to }
  return null
}

/**
 * 本地日区间 → 查询用 ISO 时间戳。
 * 起点取本地 00:00:00.000，终点取本地 23:59:59.999 —— 保证「今天」按用户所在时区整天命中。
 */
export function rangeToIso(range: DateRange): { fromIso: string; toIso: string } {
  const fromIso = range.from ? new Date(`${range.from}T00:00:00.000`).toISOString() : ""
  const toIso = range.to ? new Date(`${range.to}T23:59:59.999`).toISOString() : ""
  return { fromIso, toIso }
}

/** 拼日历用的 YYYY-MM-DD */
export function ymdOf(year: number, monthIndex: number, day: number): string {
  return `${year}-${`${monthIndex + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`
}
