"use client"

// 后台列表通用查询 hook：分页 + 列筛选 + 拉取，全部走服务端。
// 约定（与 api/recipes 保持一致）：page 从 1 起，pageSize 默认 50、上限 100；
// 多选筛选用逗号拼接；日期筛选发 `${key}From` / `${key}To` 两个 ISO 时间戳。

import { useCallback, useEffect, useMemo, useState } from "react"
import { rangeToIso, type DateRange } from "@cookmate/shared/constants/date-presets"

/** 单个列的筛选值：文本 / 多选 / 日期区间 */
export type FilterValue = string | string[] | DateRange | undefined

export interface TableQuery<T> {
  data: T | null
  loading: boolean
  error: string
  page: number
  pageSize: number
  setPage: (p: number) => void
  filters: Record<string, FilterValue>
  setFilter: (key: string, value: FilterValue) => void
  clearFilters: () => void
  activeCount: number
  reload: () => void
}

/** 筛选值是否算「已启用」 */
export function isFilterActive(v: FilterValue): boolean {
  if (v == null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === "object") return !!(v.from || v.to)
  return v.trim().length > 0
}

export function useTableQuery<T>(endpoint: string, pageSize = 50): TableQuery<T> {
  const [data, setData] = useState<T | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, FilterValue>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    for (const [key, value] of Object.entries(filters)) {
      if (!isFilterActive(value)) continue
      if (Array.isArray(value)) {
        params.set(key, value.join(","))
      } else if (typeof value === "string") {
        params.set(key, value.trim())
      } else if (value) {
        const { fromIso, toIso } = rangeToIso(value)
        if (fromIso) params.set(`${key}From`, fromIso)
        if (toIso) params.set(`${key}To`, toIso)
      }
    }

    setLoading(true)
    fetch(`${endpoint}?${params.toString()}`)
      .then(async (r) => ({ ok: r.ok, body: (await r.json().catch(() => ({}))) as Record<string, unknown> }))
      .then((res) => {
        if (!alive) return
        if (!res.ok) {
          setError(typeof res.body.error === "string" ? res.body.error : "加载失败")
          setData(null)
        } else {
          setError("")
          setData(res.body as T)
        }
      })
      .catch(() => {
        if (alive) {
          setError("网络错误，请重试")
          setData(null)
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [endpoint, page, pageSize, filters, tick])

  // 改筛选一律回到第 1 页，否则会停在空页
  const setFilter = useCallback((key: string, value: FilterValue) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setPage(1)
    setFilters({})
  }, [])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => isFilterActive(v)).length,
    [filters],
  )

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    setPage,
    filters,
    setFilter,
    clearFilters,
    activeCount,
    reload,
  }
}
