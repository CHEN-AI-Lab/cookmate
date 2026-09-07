// 免费版用量限制测试 — 直接测试 auth-helpers 中的限制检查函数
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'
import { STARRED_RECIPE_LIMIT, RECIPE_COUNT_LIMIT, PANTRY_ITEM_LIMIT, MEAL_PLAN_DAYS_LIMIT } from '@cookmate/shared/constants/usage-limits'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/auth-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-helpers')>()
  return {
    ...actual,
    // 让其他测试不受影响
    checkUsageLimit: vi.fn(async () => true),
    incrementUsage: vi.fn(async () => {}),
    isDemoUser: vi.fn(() => false),
  }
})

import { checkStarredLimit, checkRecipeCountLimit, checkPantryLimit, checkMealPlanDaysLimit, isFreeUser } from '@/lib/auth-helpers'

beforeEach(() => {
  resetPrisma()
})

describe('免费版限制 — 常量值', () => {
  it('收藏上限 = 10', () => expect(STARRED_RECIPE_LIMIT).toBe(10))
  it('菜谱上限 = 25', () => expect(RECIPE_COUNT_LIMIT).toBe(25))
  it('食材库上限 = 15', () => expect(PANTRY_ITEM_LIMIT).toBe(15))
  it('周计划天数上限 = 3', () => expect(MEAL_PLAN_DAYS_LIMIT).toBe(3))
})

describe('免费版限制 — isFreeUser', () => {
  it('FREE 用户 → true', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null })
    expect(await isFreeUser('u1')).toBe(true)
  })
  it('PRO 用户 → false', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: null })
    expect(await isFreeUser('u1')).toBe(false)
  })
})

describe('免费版限制 — checkStarredLimit', () => {
  it('收藏数 < 10 → false（未超限）', async () => {
    stores.recipes.set('r1', { id: 'r1', userId: 'u1', starred: true })
    stores.recipes.set('r2', { id: 'r2', userId: 'u1', starred: true })
    expect(await checkStarredLimit('u1')).toBe(false)
  })
  it('收藏数 = 10 → true（已达上限）', async () => {
    for (let i = 1; i <= 10; i++) {
      stores.recipes.set(`r${i}`, { id: `r${i}`, userId: 'u1', starred: true })
    }
    expect(await checkStarredLimit('u1')).toBe(true)
  })
  it('收藏数 > 10 → true', async () => {
    for (let i = 1; i <= 12; i++) {
      stores.recipes.set(`r${i}`, { id: `r${i}`, userId: 'u1', starred: true })
    }
    expect(await checkStarredLimit('u1')).toBe(true)
  })
})

describe('免费版限制 — checkRecipeCountLimit', () => {
  it('菜谱数 < 25 → false', async () => {
    for (let i = 1; i <= 5; i++) {
      stores.recipes.set(`r${i}`, { id: `r${i}`, userId: 'u1' })
    }
    expect(await checkRecipeCountLimit('u1')).toBe(false)
  })
  it('菜谱数 = 25 → true', async () => {
    for (let i = 1; i <= 25; i++) {
      stores.recipes.set(`r${i}`, { id: `r${i}`, userId: 'u1' })
    }
    expect(await checkRecipeCountLimit('u1')).toBe(true)
  })
})

describe('免费版限制 — checkPantryLimit', () => {
  it('食材数 < 15 → false', async () => {
    for (let i = 1; i <= 5; i++) {
      stores.pantries.set(`p${i}`, { id: `p${i}`, userId: 'u1', name: `食材${i}` })
    }
    expect(await checkPantryLimit('u1')).toBe(false)
  })
  it('食材数 = 15 → true', async () => {
    for (let i = 1; i <= 15; i++) {
      stores.pantries.set(`p${i}`, { id: `p${i}`, userId: 'u1', name: `食材${i}` })
    }
    expect(await checkPantryLimit('u1')).toBe(true)
  })
})

describe('免费版限制 — checkMealPlanDaysLimit', () => {
  it('本周周计划天数 < 3 → false', async () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    stores.mealPlans.set('mp1', { id: 'mp1', userId: 'u1', weekStart: monday })
    stores.mealSlots.push(
      { id: 'ms1', mealPlanId: 'mp1', dayOfWeek: 1 },
      { id: 'ms2', mealPlanId: 'mp1', dayOfWeek: 2 },
    )
    expect(await checkMealPlanDaysLimit('u1')).toBe(false)
  })
  it('本周周计划天数 = 3 → true', async () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    stores.mealPlans.set('mp1', { id: 'mp1', userId: 'u1', weekStart: monday })
    stores.mealPlans.set('mp2', { id: 'mp2', userId: 'u1', weekStart: monday })
    stores.mealPlans.set('mp3', { id: 'mp3', userId: 'u1', weekStart: monday })
    stores.mealSlots.push(
      { id: 'ms1', mealPlanId: 'mp1', dayOfWeek: 1 },
      { id: 'ms2', mealPlanId: 'mp2', dayOfWeek: 2 },
      { id: 'ms3', mealPlanId: 'mp3', dayOfWeek: 3 },
    )
    expect(await checkMealPlanDaysLimit('u1')).toBe(true)
  })
})
