"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ReactNode } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { MealPlanGrid } from "@/components/features/MealPlanGrid"
import { MealPlanDetailModal } from "@/components/features/MealPlanDetailModal"
import { UpgradeDialog, UpgradeInline } from "@/components/features/UpgradeLink"
import { getDemoMealPlan } from "@cookmate/shared/demo-data"
import { API_TIMEOUT } from "@cookmate/shared/constants/api-errors"
import { MEAL_PLAN_DAYS_LIMIT } from "@cookmate/shared/constants/usage-limits"
import {
  fetchWithTimeout,
  parseJsonSafely,
  classifyNetworkError,
  classifyHttpError,
  emptyDataError,
  kindToMessageKey,
  errorLogContext,
  type ApiErrorInfo,
} from "@cookmate/shared/utils/api-error"
import { SUBSCRIPTION_TIER } from "@cookmate/shared/constants"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

interface Recipe {
  id?: string
  title: string
  description: string
  ingredients?: string
  steps?: string
  cookingTime?: number
  calories?: number
  cuisineType?: string
  starred?: boolean
}

interface MealSlot {
  id: string
  dayOfWeek: number
  mealType: string
  recipe: Recipe | null
  note: string | null
}

interface MealPlan {
  id: string
  weekStart: string
  slots: MealSlot[]
}

export default function MealPlanPage() {
  const t = useTranslations("mealPlan")
  const locale = useLocale()
  const tc = useTranslations("common")
  // 收藏上限等 billing 命名空间的提示（后端返回裸 key，这里负责翻译）
  const tb = useTranslations("billing")
  const DAY_LABELS = [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday"), t("sunday")]
  const router = useRouter()
  const MEAL_LABELS: Record<string, string> = {
    breakfast: t("breakfast"), lunch: t("lunch"), dinner: t("dinner"),
  }

  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<ReactNode>("")
  // 结构化错误信息：用于「是否可重试」判断与控制台日志定位（不直接展示 detail）
  const [errorInfo, setErrorInfo] = useState<ApiErrorInfo | null>(null)
  // AI 降级等"有结果但不完美"的提示，用提示条而非红字错误
  const [notice, setNotice] = useState("")
  const [detail, setDetail] = useState<{ day: number; meal: string } | null>(null)
  const [starToast, setStarToast] = useState("")
  const [demoToast, setDemoToast] = useState("")
  // 体验模式统一提示（文案与全站一致）
  const showDemoToast = () => {
    setDemoToast(t("demoLocked"))
    setTimeout(() => setDemoToast(""), 2500)
  }
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDemoUser, setIsDemoUser] = useState(false)
  // 免费版用户标识：与 subscriptionTier === SUBSCRIPTION_TIER.FREE 一致，用于 picker 限制最多选 3 天
  const [freeUser, setFreeUser] = useState(false)
  // 收藏上限横幅（持久显示，带内嵌升级链接）：收藏操作在详情弹窗里触发，
  // toast 2.5 秒就没了，用户经常来不及看原因，所以再加一条横幅兜底
  const [starBanner, setStarBanner] = useState(false)
  const [limitNotice, setLimitNotice] = useState<null | { kind: "reached" } | { kind: "exceed"; picked: number; remaining: number }>(null)
  // 免费版剩余可规划天数：3 - 本周已规划天数（0 = 已用完）
  const [freeRemainingDays, setFreeRemainingDays] = useState(0)

  // 弹窗状态
  const [showPicker, setShowPicker] = useState(false)
  const [pickStart, setPickStart] = useState<number | null>(null)
  const [pickEnd, setPickEnd] = useState<number | null>(null)

  // 防重复点击：setState 有渲染延迟，连续点击时用 ref 立即拦截
  const generatingRef = useRef(false)
  // 记住上次生成的天数，失败重试时直接复用
  const lastDaysRef = useRef<number[] | null>(null)

  useEffect(() => {
    fetch("/api/meal-plan")
      .then((r) => r.json())
      .then((data) => {
        if (data.plans?.length > 0) setPlan(data.plans[0])
      })
      .catch((err) => console.error("load meal plan error:", err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.isDemoUser) {
          setIsDemoUser(true)
          setPlan((prev) => prev || getDemoMealPlan(locale))
        }
        // 免费版标识：严格跟后端 isFreeUser() 保持一致——只认 subscriptionTier。
        // 降级由 /api/cron/expire-sweep 统一处理（会把 tier 改成 FREE），
        // 前端不能自行把「到期但仍是 PRO」的用户按免费版显示，否则用户看到自己是会员却受限。
        if (data.subscriptionTier === SUBSCRIPTION_TIER.FREE && !data.isDemoUser) setFreeUser(true)
      })
      .catch((err) => console.error("load profile error:", err))
  }, [locale])

  const openPicker = () => {
    setPickStart(null)
    setPickEnd(null)
    // 免费版：实时计算剩余可规划天数（3 - 本周已规划天数）
    const plannedDays = new Set(
      (plan?.slots || []).filter((s) => s.recipe !== null).map((s) => s.dayOfWeek)
    )
    setFreeRemainingDays(Math.max(0, MEAL_PLAN_DAYS_LIMIT - plannedDays.size))
    setShowPicker(true)
  }

  // picker 中本次已圈选的天数长度（未选完时为 0），用于免费版额度提示的三态切换

  const handleDayClick = (i: number) => {
    setLimitNotice(null)
    if (pickStart === null) {
      setPickStart(i)
    } else if (pickEnd === null) {
      setPickEnd(i)
    } else {
      setPickStart(i)
      setPickEnd(null)
    }
  }

  /** 把失败写进 state + 控制台（保留 detail 便于定位，界面只展示分类文案） */
  const failWith = useCallback(
    (info: ApiErrorInfo) => {
      console.error(errorLogContext("meal-plan:generate", info))
      setErrorInfo(info)
      const key = kindToMessageKey(info.kind)
      // 每日次数用完：文案内嵌「升级 Pro」超链接；其余错误保持纯文本
      setError(
        key === "genError_rateLimit"
          ? t.rich("genError_rateLimit", { upgrade: (chunks) => <UpgradeInline>{chunks}</UpgradeInline> })
          : t(key)
      )
    },
    [t]
  )

  const runGenerate = useCallback(
    async (days: number[]) => {
      if (generatingRef.current) return // 重复点击直接忽略
      generatingRef.current = true
      lastDaysRef.current = days

      setGenerating(true)
      setError("")
      setErrorInfo(null)
      setNotice("")
      try {
        const res = await fetchWithTimeout("/api/meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days }),
          // 后端 maxDuration=60s，前端必须比它长，否则后端还在生成前端就断了
          timeoutMs: API_TIMEOUT.mealPlanGenerate,
        })
        const data = await parseJsonSafely(res)

        // 平台超时（504）返回的往往是 HTML，parseJsonSafely 会得到 null
        if (!res.ok || !data) {
          // 免费版限制：后端返回裸 key，前端用 t() 翻译展示具体文案
          if (res.status === 403) {
            if (data?.error === "mealPlanDaysLimit") {
              console.error(errorLogContext("meal-plan:generate", { kind: "paymentRequired", status: 403, detail: "meal_plan_days_limit", retryable: false }))
              setError(t("genError_mealPlanDaysLimit"))
              setErrorInfo(null)
              return
            }
            if (data?.error === "recipeLimit") {
              console.error(errorLogContext("meal-plan:generate", { kind: "paymentRequired", status: 403, detail: "recipe_count_limit", retryable: false }))
              setError(t("genError_recipeLimit"))
              setErrorInfo(null)
              return
            }
          }
          failWith(classifyHttpError(res, data))
          return
        }

        const slots = (data.plan as { slots?: unknown } | null)?.slots
        if (!Array.isArray(slots) || slots.length === 0) {
          failWith(emptyDataError(`plan.slots is empty; response keys=${Object.keys(data).join(",")}`))
          return
        }

        setPlan(data.plan as MealPlan)

        // AI 降级：数据可用，只是不是 AI 生成的 → 用提示条，不再伪装成"失败"
        if (data.fallback) {
          const reason = typeof data.reason === "string" ? data.reason : "ai_error"
          setNotice(
            reason === "no_key" ? t("fallbackNoKey") : t("fallbackAiBusy")
          )
        }
        // 未落库提示独立于 fallback 判断：AI 正常但写库失败时 saved 同样为 false，
        // 原先这段挂在 if (data.fallback) 里，导致写库失败时毫无提示，用户刷新才发现计划没了。
        if (data.saved === false) {
          setNotice((prev) => (prev ? `${prev}${t("notSavedHint")}` : t("notSavedHint")))
        }
      } catch (err) {
        failWith(classifyNetworkError(err, API_TIMEOUT.mealPlanGenerate))
      } finally {
        generatingRef.current = false
        setGenerating(false)
      }
    },
    [failWith, t]
  )

  const confirmGenerate = async () => {
    if (pickStart === null || pickEnd === null) return
    const lo = Math.min(pickStart, pickEnd)
    const hi = Math.max(pickStart, pickEnd)
    const days: number[] = []
    for (let i = lo; i <= hi; i++) days.push(i)

    // 免费版前端拦截：区间天数超过剩余可规划天数时在按钮上方提示，不发请求
    // 后端也有同样的检查（checkMealPlanDaysLimitForDays），这里是体验优化
    if (freeUser && days.length > freeRemainingDays) {
      setLimitNotice(
        freeRemainingDays <= 0
          ? { kind: "reached" }
          : { kind: "exceed", picked: days.length, remaining: freeRemainingDays },
      )
      return
    }

    setShowPicker(false)
    await runGenerate(days)
  }

  /** 失败重试：复用上次选中的天数 */
  const retryGenerate = () => {
    if (lastDaysRef.current) void runGenerate(lastDaysRef.current)
  }

  const getSlot = (day: number, meal: string): MealSlot | undefined =>
    plan?.slots.find((s) => s.dayOfWeek === day && s.mealType === meal)

  const deleteSlot = async () => {
    if (!detail || !plan) return
    if (isDemoUser) {
      showDemoToast()
      return
    }
    setDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!detail || !plan) return
    const slot = getSlot(detail.day, detail.meal)
    if (!slot) return
    try {
      const res = await fetch("/api/meal-plan/slot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, title: "", description: "" }),
      })
      if (!res.ok) throw new Error(t("deleteSlotFailed"))
    } catch (err) {
      console.error("delete slot error:", err)
      return
    }
    const updatedSlots = plan.slots.map((s) =>
      s.dayOfWeek === detail.day && s.mealType === detail.meal ? { ...s, recipe: null } : s
    )
    setPlan({ ...plan, slots: updatedSlots })
    setDetail(null)
    setStarToast(t("deleteSlotSuccess"))
    setTimeout(() => setStarToast(""), 2500)
  }

  const toggleStar = async (recipeId: string) => {
    // 体验态：收藏是写操作，直接给统一提示，不要让它走到接口拿 403 后静默失败
    if (isDemoUser) {
      showDemoToast()
      return
    }
    const r = await fetch("/api/recipes/star", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    })
    const data = await r.json()
    if (data.success) {
      setPlan((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slots: prev.slots.map((s) =>
            s.recipe?.id === recipeId ? { ...s, recipe: { ...s.recipe, starred: data.starred } as Recipe } : s
          ),
        }
      })
      setStarToast(data.starred ? t("starToast") : t("unstarToast"))
      setTimeout(() => setStarToast(""), 2500)
    } else if (data.error === "starLimitReached") {
      // 后端返回裸 key：toast 给即时反馈（此时弹窗还开着），横幅在关闭弹窗后持久兜底
      setStarToast(tb("starLimitReached"))
      setTimeout(() => setStarToast(""), 3000)
      setStarBanner(true)
    }
  }

  if (loading) return <div className="text-center py-16 text-text-secondary">{t("loading")}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <button
          onClick={isDemoUser ? showDemoToast : openPicker}
          disabled={generating}
          className="bg-accent text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {generating ? t("generating") : t("generate")}
        </button>
      </div>

      {/* AI 降级提示：有数据可用，只是不是 AI 生成的，用提示条区分于真正的错误 */}
      {notice && (
        <p className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          {notice}
        </p>
      )}

      {error && (() => {
        // 限额提示是升级引导而非报错：品牌配色；网络/服务故障保持红色。
        // 框宽贴合文字（w-fit）并水平居中，不留大片空白（Carbon Toast 规范：提示不应占满整行）。
        const isRateLimit = errorInfo?.kind === "rateLimit"
        const boxCls = "mb-4 mx-auto w-fit max-w-full flex items-center gap-3 rounded-xl px-4 py-2.5 " + (isRateLimit ? "bg-bg-brand border border-accent/60" : "bg-red-50 border border-red-200")
        const textCls = "text-sm " + (isRateLimit ? "text-text-primary" : "text-red-700")
        const btnCls = "shrink-0 text-sm font-medium underline disabled:opacity-50 " + (isRateLimit ? "text-accent" : "text-red-700")
        return (
          <div className={boxCls}>
            <p className={textCls}>{error}</p>
            {errorInfo?.retryable && (
              <button
                onClick={retryGenerate}
                disabled={generating}
                className={btnCls}
              >
                {tc("retry")}
              </button>
            )}
          </div>
        )
      })()}

      {/* 收藏上限：居中弹框，升级入口嵌在文案中间；收藏在详情弹窗里触发，弹框永远在视口正中 */}
      {starBanner && (
        <UpgradeDialog
          text={tb.rich("starLimitReached", {
            upgrade: (chunks) => <UpgradeInline>{chunks}</UpgradeInline>,
          })}
          onClose={() => setStarBanner(false)}
        />
      )}

      {!plan && !generating && (
        <div className="text-center py-16">
          <span className="text-5xl">📋</span>
          <p className="mt-4 text-text-secondary">{t("noPlan")}</p>
          <p className="text-sm text-text-secondary mt-1">{t("noPlanHint")}</p>
        </div>
      )}

      {generating && (
        <div className="text-center py-16">
          <span className="text-5xl animate-bounce">🤔</span>
          <p className="mt-4 text-text-secondary">{t("generatingDesc")}</p>
        </div>
      )}

      {plan && !generating && (
        <MealPlanGrid plan={plan} onSlotClick={(day, meal) => setDetail({ day, meal })} />
      )}

      <MealPlanDetailModal
        open={detail !== null}
        onClose={() => setDetail(null)}
        day={detail?.day ?? 0}
        meal={detail?.meal ?? ""}
        slot={detail ? getSlot(detail.day, detail.meal) : undefined}
        dayLabels={DAY_LABELS}
        mealLabels={MEAL_LABELS}
        onToggleStar={toggleStar}
        onDeleteSlot={deleteSlot}
        onNavigateTo={(path) => router?.push(path)}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-card rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <p className="text-sm text-text-primary font-medium mb-1">{t("confirmDeleteTitle")}</p>
            <p className="text-sm text-text-secondary">{t("confirmDeleteDesc", { title: detail && plan ? getSlot(detail.day, detail.meal)?.recipe?.title || "" : "" })}</p>
            <p className="text-xs text-text-secondary mt-2">{t("irreversible")}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 bg-surface text-text-secondary py-2 rounded-xl text-sm">{tc("cancel")}</button>
              <button onClick={() => { setDeleteConfirm(false); confirmDelete() }} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm">{t("confirmDelete")}</button>
            </div>
          </div>
        </div>
      )}

      {starToast && (
        <div className="fixed left-1/2 top-[33vh] -translate-x-1/2 bg-card border border-border text-text-primary px-6 py-3 rounded-xl text-sm shadow-lg z-[100]">
          {starToast}
        </div>
      )}

      {demoToast && (
        <div className="fixed left-1/2 top-[33vh] -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-800 px-6 py-3 rounded-xl text-sm shadow-lg z-[100]">
          {demoToast}
        </div>
      )}

      {/* 选天数弹窗 — 严格对齐测试页方案D */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-white w-full max-w-[440px] p-6"
            style={{ borderRadius: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 + 关闭按钮 */}
            <div className="flex items-center justify-between mb-1">
              <div className="text-[17px] font-bold text-text-primary">{t("generate")}</div>
              <button
                onClick={() => setShowPicker(false)}
                className="text-[20px] text-text-secondary hover:text-text-primary transition-colors px-2"
                style={{ border: "none", background: "none", cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            {/* 副标题 */}
            <p className="text-[13px] text-text-secondary mb-4">{t("pickerHint")}</p>

            {/* 星期格子 */}
            <div className="grid grid-cols-7 gap-1.5 mb-2.5">
              {DAYS.map((key, i) => {
                const hasOld = plan?.slots.some((s) => s.dayOfWeek === i && s.recipe !== null)
                const isStart = pickStart !== null && pickEnd === null && i === pickStart
                const isHint = pickStart !== null && pickEnd === null && i !== pickStart
                const inRange = pickStart !== null && pickEnd !== null
                const lo = inRange ? Math.min(pickStart!, pickEnd!) : 0
                const hi = inRange ? Math.max(pickStart!, pickEnd!) : 0
                const isRangeMid = inRange && i >= lo && i <= hi && i !== lo && i !== hi
                const isRangeEnd = inRange && (i === lo || i === hi)

                let style: React.CSSProperties = {
                  borderRadius: 10,
                  border: "1.5px dashed #fed7aa",
                  padding: "10px 0",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#6b7280",
                  background: "#fff",
                  cursor: "pointer",
                  transition: "all .15s",
                }
                if (hasOld && !isStart && !isRangeMid && !isRangeEnd) {
                  style = { ...style, borderStyle: "solid", borderColor: "#22c55e", background: "#f0fdf4", color: "#16a34a", fontWeight: 600 }
                }
                if (isStart) {
                  style = { ...style, borderStyle: "solid", borderColor: "#FF6B35", background: "#FF6B35", color: "#fff", fontWeight: 700 }
                }
                if (isHint) {
                  style = { ...style, animation: "pickerPulse 1.2s infinite" }
                }
                if (isRangeMid) {
                  style = { ...style, borderStyle: "solid", borderColor: "#FF6B35", background: "#ffedd5", color: "#FF6B35", fontWeight: 600 }
                }
                if (isRangeEnd) {
                  style = { ...style, borderStyle: "solid", borderColor: "#FF6B35", background: "#FF6B35", color: "#fff", fontWeight: 700 }
                }
                return (
                  <div key={key} style={style} onClick={() => handleDayClick(i)}>
                    {t(key)}
                  </div>
                )
              })}
            </div>

            {/* 图例 */}
            <div className="flex gap-4 text-[12px] text-text-secondary mt-1.5 mb-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span style={{ width: 12, height: 12, borderRadius: 4, background: "#FF6B35", display: "inline-block" }} />
                {t("pickerLegendGenerate")}
              </span>
              <span className="flex items-center gap-1.5">
                <span style={{ width: 12, height: 12, borderRadius: 4, background: "#16a34a", display: "inline-block" }} />
                {t("pickerLegendExisting")}
              </span>
            </div>

            {/* 免费版剩余额度常态提示；额度用完或超限不在下方固定展示，改为点「确认生成」时弹框提示 */}
            {freeUser && freeRemainingDays > 0 && (
              <div className="mb-3 text-[13px] rounded-xl px-4 py-2.5 bg-bg-brand border border-accent/40 text-text-secondary">
                {t("freeLimitHint", { days: freeRemainingDays })}
              </div>
            )}

            {/* 信息提示框 */}
            <div
              className="text-[13px] mb-4 leading-relaxed"
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 12,
                padding: "12px 16px",
                minHeight: 48,
              }}
              dangerouslySetInnerHTML={{
                __html: pickStart === null
                  ? t("pickerSelectStart")
                  : pickEnd === null
                    ? t("pickerSelectEnd")
                    : (() => {
                        const lo = Math.min(pickStart!, pickEnd!)
                        const hi = Math.max(pickStart!, pickEnd!)
                        const n = hi - lo + 1
                        const range = `从 <b style="color:#FF6B35">${t(DAYS[lo])}</b> 到 <b style="color:#FF6B35">${t(DAYS[hi])}</b>，共 <b style="color:#FF6B35">${n} 天 ${n * 3} 餐</b>`
                        const tip = n >= 6 ? `<br><span style="color:#6b7280;font-size:12px">💡 ${t("pickerTip")}</span>` : ""
                        return `${range}${tip}`
                      })(),
              }}
            />

            {/* 免费版超限提示：点「确认生成」时显示在此处（不用弹框，弹框会被选择器遮挡） */}
            {limitNotice && (
              <div className="mt-4 text-[13px] rounded-xl px-4 py-2.5 bg-bg-brand border border-accent/60 text-text-primary leading-relaxed">
                {limitNotice.kind === "reached"
                  ? t.rich("freeLimitReached", { upgrade: (chunks) => <UpgradeInline>{chunks}</UpgradeInline> })
                  : t.rich("freeLimitExceed", { picked: limitNotice.picked, remaining: limitNotice.remaining, upgrade: (chunks) => <UpgradeInline>{chunks}</UpgradeInline> })}
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowPicker(false)}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all"
                style={{ border: "none", background: "#f3f4f6", color: "#6b7280", cursor: "pointer" }}
              >
                {tc("cancel")}
              </button>
              {(() => {
                const disabled = pickStart === null || pickEnd === null || generating
                return (
                  <button
                    onClick={confirmGenerate}
                    disabled={disabled}
                    className="flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all"
                    style={{
                      border: "none",
                      background: disabled ? "#fed7aa" : "#FF6B35",
                      color: "#fff",
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {generating ? t("generating") : t("confirmGenerate")}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}