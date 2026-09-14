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
    canUseAiToday: vi.fn(async () => true),
    incrementAiUsage: vi.fn(async () => {}),
    isDemoUser: vi.fn(() => false),
  }
})

import {
  isFreeUser,
  checkStarredLimit,
  checkRecipeCountLimit,
  checkRecipeCountLimitForCount,
  checkPantryLimit,
  checkMealPlanDaysLimit,
  checkMealPlanDaysLimitForDays,
} from '@/lib/auth-helpers'

beforeEach(() => {
  resetPrisma()
})

/** 取本周一 00:00，与后端 getCurrentWeekPlanDays 的算法保持一致 */
function thisMonday(): Date {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * 种入本周的周计划槽位。
 * empty=true 模拟「删掉了菜谱」的状态：MealSlot 记录还在，但 recipeId 已被置空。
 */
function seedWeekSlots(days: number[], opts?: { empty?: boolean }) {
  stores.mealPlans.set('mp1', { id: 'mp1', userId: 'u1', weekStart: thisMonday() })
  days.forEach((dayOfWeek, i) => {
    stores.mealSlots.push({
      id: `ms${i}`,
      mealPlanId: 'mp1',
      dayOfWeek,
      recipeId: opts?.empty ? null : `r${i}`,
    })
  })
}

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
  it('PRO 但已过期 → true（到期即按免费版算，不等 cron 降级）', async () => {
    // 口径变更（2026-09-11）：以前约定「不在接口里提前降级，避免页面显示 PRO 但功能被限」。
    // 但用户页面（dashboard）现在本来就是按到期日**实时**算的、到期即显示免费版，
    // 所以后端再不跟上就变成反向的割裂：页面说免费、功能照给（过期用户仍能无限生成）。
    // 现在 isFreeUser / canUseAiToday 都走 effectiveTier()，与页面同一套判断。
    const past = new Date()
    past.setDate(past.getDate() - 1)
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: past })
    expect(await isFreeUser('u1')).toBe(true)
  })
  it('FREE 但权益未过期 → false（免费体验期内不受限）', async () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: future })
    expect(await isFreeUser('u1')).toBe(false)
  })
  it('FREE 且权益已过期 → true', async () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: past })
    expect(await isFreeUser('u1')).toBe(true)
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
  it('本周已规划 2 天 → false（未超限）', async () => {
    seedWeekSlots([1, 2])
    expect(await checkMealPlanDaysLimit('u1')).toBe(false)
  })
  it('本周已规划 3 天 → true（已达上限）', async () => {
    seedWeekSlots([1, 2, 3])
    expect(await checkMealPlanDaysLimit('u1')).toBe(true)
  })
  it('同一天的多个槽位只算 1 天', async () => {
    seedWeekSlots([1, 1, 1])
    expect(await checkMealPlanDaysLimit('u1')).toBe(false)
  })
  it('已清空的槽位（recipeId 为 null）不计入占用', async () => {
    // 用户把已规划的 3 天全部删空后，额度应回到可用状态；
    // 后端若不去重空槽，这里会变成"前端显示还有额度、后端却 403"。
    seedWeekSlots([1, 2, 3], { empty: true })
    expect(await checkMealPlanDaysLimit('u1')).toBe(false)
  })
})

describe('免费版限制 — checkMealPlanDaysLimitForDays（批量生成）', () => {
  it('本周 0 天，本次选 3 天 → false', async () => {
    seedWeekSlots([])
    expect(await checkMealPlanDaysLimitForDays('u1', [0, 1, 2])).toBe(false)
  })
  it('本周 0 天，本次选 4 天 → true（一次性超上限必须拦）', async () => {
    seedWeekSlots([])
    expect(await checkMealPlanDaysLimitForDays('u1', [0, 1, 2, 3])).toBe(true)
  })
  it('本周 0 天，本次选 7 天 → true（整周绕过）', async () => {
    seedWeekSlots([])
    expect(await checkMealPlanDaysLimitForDays('u1', [0, 1, 2, 3, 4, 5, 6])).toBe(true)
  })
  it('本周已占 2 天，本次再选 1 个新天 → false（并集正好 3 天）', async () => {
    seedWeekSlots([0, 1])
    expect(await checkMealPlanDaysLimitForDays('u1', [2])).toBe(false)
  })
  it('本周已占 2 天，本次再选 2 个新天 → true（并集 4 天）', async () => {
    seedWeekSlots([0, 1])
    expect(await checkMealPlanDaysLimitForDays('u1', [2, 3])).toBe(true)
  })
  it('本周已占 3 天，本次选已占用的天 → false（覆盖不新增天数）', async () => {
    // add 路由依赖这条：占满 3 天后仍要允许替换已有那天的菜谱
    seedWeekSlots([0, 1, 2])
    expect(await checkMealPlanDaysLimitForDays('u1', [1])).toBe(false)
  })
  it('本周已占 3 天，本次选新的一天 → true', async () => {
    seedWeekSlots([0, 1, 2])
    expect(await checkMealPlanDaysLimitForDays('u1', [3])).toBe(true)
  })
})

describe('免费版限制 — checkRecipeCountLimitForCount（批量写入）', () => {
  function seedRecipes(n: number) {
    for (let i = 1; i <= n; i++) {
      stores.recipes.set(`r${i}`, { id: `r${i}`, userId: 'u1' })
    }
  }
  it('已有 20 个，本次新增 3 → false（合计 23 ≤ 25）', async () => {
    seedRecipes(20)
    expect(await checkRecipeCountLimitForCount('u1', 3)).toBe(false)
  })
  it('已有 20 个，本次新增 9 → true（周计划 3 天会写 9 个）', async () => {
    seedRecipes(20)
    expect(await checkRecipeCountLimitForCount('u1', 9)).toBe(true)
  })
  it('已有 24 个，本次新增 1 → false（刚好用满不算越限）', async () => {
    seedRecipes(24)
    expect(await checkRecipeCountLimitForCount('u1', 1)).toBe(false)
  })
  it('已有 24 个，本次新增 2 → true', async () => {
    seedRecipes(24)
    expect(await checkRecipeCountLimitForCount('u1', 2)).toBe(true)
  })
})
