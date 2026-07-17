/**
 * Subscription cancellation logic tests.
 *
 * Tests cover the three pieces of business logic that drive
 * the cancel-subscription flow:
 *   1. isExpired()     — date-based expiry check (dashboard/route.ts)
 *   2. cancelled flag  — tier === "PRO" && !creemSubscriptionId
 *   3. UI conditions   — show cancel button vs cancelled badge vs hide
 *
 * These functions live inside the route handler and aren't exported,
 * so we test the logic directly by reimplementing the expressions
 * (pure boolean / date arithmetic — no mocking needed).
 */

import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Helpers — reproduce the exact logic from dashboard/route.ts
// ---------------------------------------------------------------------------

/** Replica of isExpired() in apps/web/src/app/api/dashboard/route.ts */
function isExpired(expiryDate: Date): boolean {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setUTCHours(0, 0, 0, 0)
  return now > expiry
}

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