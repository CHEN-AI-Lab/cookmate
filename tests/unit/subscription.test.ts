/**
 * Subscription cancellation logic tests.
 *
 * Tests cover the three pieces of business logic that drive
 * the cancel-subscription flow:
 *   1. isExpired()     — date-based expiry check (shared/utils/subscription.ts)
 *   2. cancelled flag  — tier === "PRO" && !creemSubscriptionId
 *   3. UI conditions   — show cancel button vs cancelled badge vs hide
 *
 * isExpired is imported from shared/utils/subscription so the test
 * validates the actual production code, not a replica.
 */

import { describe, it, expect } from 'vitest'
import { isExpired, addMonths, addYears } from '@cookmate/shared/utils/subscription'

// ---------------------------------------------------------------------------
// Helpers — reproduce the exact logic from dashboard/route.ts
// ---------------------------------------------------------------------------

/** Replica of the cancelled computation: subscription was cancelled but
 *  the user still has Pro until the current billing period ends. */
function isCancelled(tier: string, creemSubscriptionId: string | null | undefined): boolean {
  return tier === "PRO" && !creemSubscriptionId
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("isExpired (date comparison, zeroing time)", () => {
  it("returns false for a date in the future", () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    expect(isExpired(future)).toBe(false)
  })

  it("returns true for a date in the past", () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(isExpired(past)).toBe(true)
  })

  it("returns false for today (same calendar day)", () => {
    expect(isExpired(new Date())).toBe(false)
  })

  it("returns true for yesterday at 23:59:59", () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setUTCHours(23, 59, 59, 999)
    expect(isExpired(yesterday)).toBe(true)
  })

  it("returns false for tomorrow at 00:00:00", () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    expect(isExpired(tomorrow)).toBe(false)
  })
})

describe("addMonths (月底越界防护)", () => {
  it("普通跨月：1月15日 + 1月 → 2月15日", () => {
    const d = new Date(Date.UTC(2026, 0, 15)) // 2026-01-15
    expect(addMonths(d, 1).toISOString().slice(0, 10)).toBe("2026-02-15")
  })

  it("月底越界：1月31日 + 1月 → 2月28日（非3月3日）", () => {
    const d = new Date(Date.UTC(2026, 0, 31)) // 2026-01-31
    expect(addMonths(d, 1).toISOString().slice(0, 10)).toBe("2026-02-28")
  })

  it("月底越界（闰年）：1月31日 + 1月 → 2月29日", () => {
    const d = new Date(Date.UTC(2024, 0, 31)) // 2024-01-31（2024 是闰年）
    expect(addMonths(d, 1).toISOString().slice(0, 10)).toBe("2024-02-29")
  })

  it("月底越界：3月31日 + 1月 → 4月30日", () => {
    const d = new Date(Date.UTC(2026, 2, 31)) // 2026-03-31
    expect(addMonths(d, 1).toISOString().slice(0, 10)).toBe("2026-04-30")
  })

  it("多年累加：1月31日 + 13月 → 次年2月28日", () => {
    const d = new Date(Date.UTC(2026, 0, 31))
    expect(addMonths(d, 13).toISOString().slice(0, 10)).toBe("2027-02-28")
  })

  it("不影响时分秒：1月15日 12:34:56 + 1月 → 2月15日 12:34:56", () => {
    const d = new Date(Date.UTC(2026, 0, 15, 12, 34, 56))
    expect(addMonths(d, 1).toISOString()).toBe("2026-02-15T12:34:56.000Z")
  })

  it("不修改原日期（immutable）", () => {
    const d = new Date(Date.UTC(2026, 0, 31))
    const before = d.toISOString()
    addMonths(d, 1)
    expect(d.toISOString()).toBe(before)
  })
})

describe("addYears (复用 addMonths，处理闰年越界)", () => {
  it("普通跨年：2026-01-15 + 1年 → 2027-01-15", () => {
    const d = new Date(Date.UTC(2026, 0, 15))
    expect(addYears(d, 1).toISOString().slice(0, 10)).toBe("2027-01-15")
  })

  it("闰年越界：2024-02-29 + 1年 → 2025-02-28（不是 2025-03-01）", () => {
    const d = new Date(Date.UTC(2024, 1, 29))
    expect(addYears(d, 1).toISOString().slice(0, 10)).toBe("2025-02-28")
  })
})

describe("cancelled flag (tier === 'PRO' && !creemSubscriptionId)", () => {
  // ── Active PRO subscription ──
  it("is false when PRO with creemSubscriptionId set", () => {
    expect(isCancelled("PRO", "sub_abc123")).toBe(false)
  })

  // ── Cancelled subscription ──
  it("is true when PRO with null creemSubscriptionId", () => {
    expect(isCancelled("PRO", null)).toBe(true)
  })

  it("is true when PRO with undefined creemSubscriptionId", () => {
    expect(isCancelled("PRO", undefined)).toBe(true)
  })

  it("is true when PRO with empty-string creemSubscriptionId (cleared)", () => {
    expect(isCancelled("PRO", "")).toBe(true)
  })

  // ── FREE users ──
  it("is false when FREE with null subscription ID", () => {
    expect(isCancelled("FREE", null)).toBe(false)
  })

  it("is false when FREE with a subscription ID (edge: double-payment)", () => {
    expect(isCancelled("FREE", "sub_abc123")).toBe(false)
  })

  it("is false when FREE with undefined", () => {
    expect(isCancelled("FREE", undefined)).toBe(false)
  })
})

describe("billing page rendering conditions", () => {
  type ShowCancelBtn = boolean
  type ShowCancelledBadge = boolean
  type ShowFreeSection = boolean

  /** Simulates the three rendering branches from billing/page.tsx */
  function branches(tier: string, cancelled: boolean): {
    showCancelBtn: ShowCancelBtn
    showCancelledBadge: ShowCancelledBadge
    showFreeSection: ShowFreeSection
  } {
    const isFree = tier === "FREE"
    return {
      showCancelBtn: !isFree && !cancelled,
      showCancelledBadge: !isFree && cancelled,
      showFreeSection: isFree,
    }
  }

  // ── Not free, not cancelled → PRO active, show cancel button ──
  it("PRO active: shows cancel button, hides cancelled badge, hides free section", () => {
    const r = branches("PRO", false)
    expect(r.showCancelBtn).toBe(true)
    expect(r.showCancelledBadge).toBe(false)
    expect(r.showFreeSection).toBe(false)
  })

  // ── Not free, cancelled → show cancelled badge, no cancel button ──
  it("PRO cancelled: shows cancelled badge, hides cancel button, hides free section", () => {
    const r = branches("PRO", true)
    expect(r.showCancelBtn).toBe(false)
    expect(r.showCancelledBadge).toBe(true)
    expect(r.showFreeSection).toBe(false)
  })

  // ── Free → show free section, nothing else ──
  it("FREE: shows free section, hides cancel button, hides cancelled badge", () => {
    const r = branches("FREE", false)
    expect(r.showCancelBtn).toBe(false)
    expect(r.showCancelledBadge).toBe(false)
    expect(r.showFreeSection).toBe(true)
  })
})