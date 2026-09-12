"use client"

// 后台表格「列头筛选」—— 每个可筛选列的标题旁一个漏斗，点开对应的筛选面板。
//
// 为什么用 portal：面板要越过表格容器的 overflow-x-auto 弹出，写在 th 里会被裁掉。
// 外部点击判定把面板 ref 与触发按钮 ref 都算进去，否则点面板内部会被判成「点了外部」。
//
// 时间列设计（2026-09-11 调研 + 用户反馈）：预设相对区间优先（今天/近7天/近30天/本月），
// 自绘日历兜底 —— 不使用原生 input[type=date]（用户明确反馈「非常难用」）。

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@cookmate/shared/utils"
import {
  DATE_PRESET_KEYS,
  presetToRange,
  toYmd,
  ymdOf,
  type DatePresetKey,
} from "@cookmate/shared/constants/date-presets"
import { isFilterActive, type FilterValue } from "@cookmate/shared/hooks/useTableQuery"

export type ColumnFilterDef =
  | { type: "text"; placeholder?: string }
  | { type: "select"; options: ReadonlyArray<{ value: string; label: string }> }
  | { type: "date" }

const PRESET_LABELS: Record<DatePresetKey, string> = {
  today: "今天",
  "7d": "近 7 天",
  "30d": "近 30 天",
  month: "本月",
  custom: "自定义",
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]

const FUNNEL_PATH = "M1.5 2h9L7.3 6v3.4L4.7 11V6L1.5 2z"

/** 表头单元格：标题 +（可选）筛选漏斗。hint 挂在标题文字上，漏斗自己带「筛选」提示。 */
export function Th({
  label,
  hint,
  filter,
  value,
  onChange,
  align = "left",
}: {
  label: string
  hint?: string
  filter?: ColumnFilterDef
  value?: FilterValue
  onChange?: (v: FilterValue) => void
  align?: "left" | "right"
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  // 每次「重置」让筛选面板里的子组件重新挂载一次，子组件的本地状态天然清空
  // （比在 useEffect 里 setState 同步外部值更干净，也不会触发级联渲染）
  const [resetKey, setResetKey] = useState(0)
  const [pos, setPos] = useState({ left: 0, top: 0 })
  const on = isFilterActive(value)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect()
      if (!r) return
      const w = panelRef.current?.offsetWidth ?? 240
      const h = panelRef.current?.offsetHeight ?? 280
      const left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12))
      let top = r.bottom + 6
      if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 6)
      setPos({ left, top })
    }
    place()
    // 面板高度会随内容变（切到「自定义」时日历才展开）。只依赖 open 会漏掉这次尺寸变化，
    // 定位就停留在旧高度上，面板下半截跑到视口外看不到。用 ResizeObserver 盯着，尺寸一变就重算。
    const ro = new ResizeObserver(place)
    if (panelRef.current) ro.observe(panelRef.current)
    const onScroll = () => {
      const r = btnRef.current?.getBoundingClientRect()
      if (!r || r.bottom < 0 || r.top > window.innerHeight) {
        setOpen(false)
        return
      }
      place()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onScroll)
    document.addEventListener("keydown", onKey)
    return () => {
      ro.disconnect()
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onScroll)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <th
      className={cn(
        "px-4 py-3 font-medium whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        on && "bg-accent/10",
      )}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
        <span title={hint} className={cn(on && "text-accent")}>
          {label}
        </span>
        {filter && onChange ? (
          <button
            ref={btnRef}
            type="button"
            title="筛选"
            aria-label={`筛选：${label}`}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-transparent text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
              on && "text-accent",
            )}
          >
            <svg viewBox="0 0 12 12" className="h-[10px] w-[10px]" aria-hidden="true">
              <path d={FUNNEL_PATH} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </span>

      {open && onChange && filter
        ? createPortal(
            <div
              ref={panelRef}
              style={{ position: "fixed", left: pos.left, top: pos.top }}
              className={cn(
                "z-[100] max-h-[calc(100vh-24px)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg",
                // 复选面板宽度随内容收缩：选项常常就两三个字（Creem / 月付），
                // 固定 240px 会在右边留一大块空白，看着很空。
                // 文本 / 日期面板保持固定宽 —— 输入框和日历需要稳定宽度，且内部有 w-full 子元素，
                // 不能跟着收缩（见 MEMORY 里「portal 面板别给子元素 w-full」那条坑）。
                filter.type === "select" ? "w-auto min-w-[140px]" : "w-[240px]",
              )}
            >
              <p className="mb-2 text-[12px] font-semibold text-gray-700">{label}</p>
              {filter.type === "text" && (
              <TextBody key={resetKey} value={value} placeholder={filter.placeholder} onChange={onChange} />
              )}
              {filter.type === "select" && (
                <SelectBody key={resetKey} options={filter.options} value={value} onChange={onChange} />
              )}
              {filter.type === "date" && <DateBody key={resetKey} value={value} onChange={onChange} />}
              <div className="mt-2.5 flex items-center justify-between border-t border-gray-200 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined)
                    setResetKey((k) => k + 1)
                  }}
                  className="text-[12px] text-gray-500 hover:text-gray-700"
                >
                  重置
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-200 px-2.5 py-1 text-[12px] text-gray-700 hover:bg-gray-100"
                >
                  关闭
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </th>
  )
}

function TextBody({
  value,
  placeholder,
  onChange,
}: {
  value?: FilterValue
  placeholder?: string
  onChange: (v: FilterValue) => void
}) {
  const external = typeof value === "string" ? value : ""
  const [local, setLocal] = useState(external)
  const [tick, setTick] = useState(0)
  // 输入法「组词中」标志。中文/日文输入法在候选词未上屏时，input.value 是拼音字母
  // （如输入「陈」时框里先是 "chen"），这时候绝对不能拿去查询：
  // 会查不到 → 列表瞬间变空 → 表被提示行替换 → 筛选面板跟着被卸载，
  // 用户看到的就是「还没输完框就退出了，还提示暂无数据」。
  const composing = useRef(false)
  // 用 ref 存最新的 onChange：父组件每次渲染都会换一个新函数，
  // 直接放进依赖里会让防抖定时器被反复重置，永远不触发。
  const cb = useRef(onChange)
  useEffect(() => {
    cb.current = onChange
  })

  useEffect(() => {
    const t = setTimeout(() => {
      if (composing.current) return
      if (local !== external) cb.current(local)
    }, 350)
    return () => clearTimeout(t)
  }, [local, external, tick])

  return (
    <>
      <input
        type="text"
        value={local}
        placeholder={placeholder ?? "包含…"}
        onChange={(e) => setLocal(e.target.value)}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={() => {
          composing.current = false
          // 组词结束时重新起一次计时，否则这次输入要等到下次敲键才会提交
          setTick((t) => t + 1)
        }}
        onKeyDown={(e) => {
          // 输入法用回车「确认候选词」时，不该当成「提交筛选」
          if (e.key !== "Enter" || e.nativeEvent.isComposing || composing.current) return
          if (local !== external) cb.current(local)
        }}
        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12.5px] text-gray-700 outline-none focus:border-accent"
      />
      <p className="mt-1.5 text-[11px] text-gray-500">
        模糊匹配 · 不区分大小写 · 输入完自动生效
      </p>
    </>
  )
}

function SelectBody({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string }>
  value?: FilterValue
  onChange: (v: FilterValue) => void
}) {
  const arr = Array.isArray(value) ? value : []
  const toggle = (v: string) => {
    onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }
  return (
    <>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2 text-[12.5px] text-gray-700">
            <input type="checkbox" checked={arr.includes(o.value)} onChange={() => toggle(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </>
  )
}

function DateBody({ value, onChange }: { value?: FilterValue; onChange: (v: FilterValue) => void }) {
  const range = value && typeof value === "object" && !Array.isArray(value) ? value : undefined
  const preset = range?.preset
  const [cal, setCal] = useState(() => {
    const base = range?.from ? new Date(`${range.from}T00:00:00`) : new Date()
    return { y: base.getFullYear(), m: base.getMonth() }
  })

  const applyPreset = (p: DatePresetKey) => {
    if (p === "custom") {
      onChange({ from: range?.from ?? "", to: range?.to ?? "", preset: "custom" })
      return
    }
    if (preset === p) {
      onChange(undefined)
      return
    }
    const r = presetToRange(p)
    if (r) onChange({ ...r, preset: p })
  }

  const pickDay = (day: string) => {
    if (!range?.from || (range.from && range.to)) {
      onChange({ from: day, to: "", preset: "custom" })
      return
    }
    if (day < range.from) onChange({ from: day, to: range.from, preset: "custom" })
    else onChange({ from: range.from, to: day, preset: "custom" })
  }

  const y = cal.y
  const m = cal.m
  const startDow = (new Date(y, m, 1).getDay() + 6) % 7
  const dayCount = new Date(y, m + 1, 0).getDate()
  const todayStr = toYmd(new Date())
  const curY = new Date().getFullYear()
  const years: number[] = []
  for (let yy = curY - 6; yy <= curY + 1; yy++) years.push(yy)

  const from = range?.from ?? ""
  const to = range?.to ?? ""
  const summary =
    preset === "custom"
      ? from || to
        ? `自定义 ${from || "…"} → ${to || "…"}`
        : ""
      : preset
        ? `${PRESET_LABELS[preset]} ${presetToRange(preset)?.from ?? ""} ~ ${presetToRange(preset)?.to ?? ""}`
        : ""

  const shift = (delta: number) => {
    let mm = m + delta
    let yy = y
    if (mm < 0) {
      mm = 11
      yy -= 1
    }
    if (mm > 11) {
      mm = 0
      yy += 1
    }
    setCal({ y: yy, m: mm })
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {DATE_PRESET_KEYS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => applyPreset(p)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
              preset === p
                ? "border-accent bg-accent text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-accent hover:text-accent",
            )}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="mt-2 w-[212px]">
          <div className="mb-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[13px] leading-none text-gray-700 hover:bg-gray-100"
            >
              ‹
            </button>
            <div className="flex items-center gap-1">
              <select
                value={y}
                onChange={(e) => setCal({ y: Number(e.target.value), m })}
                className="rounded-md border border-gray-200 bg-white px-1 py-0.5 text-[12px] text-gray-700"
              >
                {years.map((yy) => (
                  <option key={yy} value={yy}>
                    {yy}
                  </option>
                ))}
              </select>
              <span className="text-[12px] text-gray-500">年</span>
              <select
                value={m}
                onChange={(e) => setCal({ y, m: Number(e.target.value) })}
                className="rounded-md border border-gray-200 bg-white px-1 py-0.5 text-[12px] text-gray-700"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <span className="text-[12px] text-gray-500">月</span>
            </div>
            <button
              type="button"
              onClick={() => shift(1)}
              className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[13px] leading-none text-gray-700 hover:bg-gray-100"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] text-gray-500">
            {WEEKDAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {Array.from({ length: startDow }, (_, i) => (
              <div key={`b${i}`} />
            ))}
            {Array.from({ length: dayCount }, (_, i) => {
              const day = i + 1
              const ds = ymdOf(y, m, day)
              const edge = ds === from || ds === to
              const inRange = !!from && !!to && ds >= from && ds <= to
              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => pickDay(ds)}
                  className={cn(
                    "rounded-lg border border-transparent py-1 text-[12px] transition-colors",
                    edge
                      ? "bg-accent font-semibold text-white"
                      : inRange
                        ? "bg-accent/10 text-gray-700"
                        : ds === todayStr
                          ? "font-semibold text-accent hover:bg-gray-100"
                          : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-1.5 text-[11px] text-gray-500">
        {summary
          ? `当前：${summary}`
          : preset === "custom"
            ? "点一个日期作为起始，再点一个作为结束"
            : "点上面一键筛选，不用碰日期控件。"}
      </p>
    </>
  )
}
