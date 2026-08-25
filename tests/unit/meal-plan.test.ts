// meal-plan 路由测试：GET 查询、POST 生成保存、targetDays 过滤、fallback 不落库、工具函数
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@cookmate/shared/api/openai', () => ({
  generateWeeklyPlan: vi.fn(),
  sanitizeWeeklyPlan: (p: any) => p,
  normalizeIngredients: (x: any) => (Array.isArray(x) ? x.map(String) : (x ? [String(x)] : [])),
}))
vi.mock('@cookmate/shared/utils/locale', () => ({
  getLocaleFromCookie: () => 'zh-CN',
  err: (loc: string, key: string) => key,
}))

import { auth } from '@/lib/auth'
import { generateWeeklyPlan } from '@cookmate/shared/api/openai'
import { GET, POST } from '@/app/api/meal-plan/route'
import { getDayMap, errMsg } from '@cookmate/shared/utils/meal-plan'

function mkRecipe(title: string) {
  return { title, description: '', ingredients: [title + ' 1'], steps: ['s'], cookingTime: 5, calories: 100, cuisineType: '中餐', difficulty: 'easy' }
}
function getReq() {
  return new Request('http://localhost/api/meal-plan', { method: 'GET' })
}
function postReq(body?: any) {
  return new Request('http://localhost/api/meal-plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  resetPrisma()
  ;(auth as any).mockResolvedValue({ user: { id: 'u1' } })
  ;(generateWeeklyPlan as any).mockReset()
  stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null, dietType: null, cuisinePref: null, servingSize: 2 })
})

describe('meal-plan GET', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await GET(getReq())
    expect(res.status).toBe(401)
  })
  it('返回本周计划', async () => {
    stores.mealPlans.set('mp1', { id: 'mp1', userId: 'u1', weekStart: new Date(), slots: [{ id: 's1', recipe: mkRecipe('早') }] })
    const res = await GET(getReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.plans.length).toBe(1)
    expect(json.weekStart).toBeTruthy()
  })
})

describe('meal-plan POST', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await POST(postReq({}))
    expect(res.status).toBe(401)
  })
  it('生成并保存（fallback=false）→ 创建 mealPlan + 3 餐', async () => {
    ;(generateWeeklyPlan as any).mockResolvedValue({
      plan: { 周一: { breakfast: mkRecipe('早'), lunch: mkRecipe('午'), dinner: mkRecipe('晚') } },
      fallback: false,
    })
    const res = await POST(postReq({ days: [0] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.fallback).toBe(false)
    expect(json.plan).toBeTruthy()
    expect(prismaMock.recipe.create).toHaveBeenCalledTimes(3)
    expect(prismaMock.mealPlan.create).toHaveBeenCalledTimes(1)
  })
  it('指定多天 → 按天生成对应数量餐', async () => {
    ;(generateWeeklyPlan as any).mockResolvedValue({
      plan: {
        周一: { breakfast: mkRecipe('早1'), lunch: mkRecipe('午1'), dinner: mkRecipe('晚1') },
        周二: { breakfast: mkRecipe('早2'), lunch: mkRecipe('午2'), dinner: mkRecipe('晚2') },
      },
      fallback: false,
    })
    const res = await POST(postReq({ days: [0, 1] }))
    expect(res.status).toBe(200)
    expect(prismaMock.recipe.create).toHaveBeenCalledTimes(6)
  })
  it('fallback=true → 不落库，直接返回生成数据', async () => {
    ;(generateWeeklyPlan as any).mockResolvedValue({
      plan: { 周一: { breakfast: mkRecipe('早'), lunch: mkRecipe('午'), dinner: mkRecipe('晚') } },
      fallback: true,
    })
    const res = await POST(postReq({ days: [0] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.fallback).toBe(true)
    expect(json.plan).toBeNull()
    expect(prismaMock.recipe.create).not.toHaveBeenCalled()
  })
})

describe('meal-plan utils', () => {
  it('getDayMap 中文映射', () => {
    expect(getDayMap('zh-CN')['周一']).toBe(0)
    expect(getDayMap('zh-CN')['周日']).toBe(6)
  })
  it('getDayMap 英文映射', () => {
    expect(getDayMap('en')['Monday']).toBe(0)
    expect(getDayMap('en')['Sunday']).toBe(6)
  })
  it('errMsg 中英切换', () => {
    expect(errMsg('zh-CN', '中文', 'English')).toBe('中文')
    expect(errMsg('en', '中文', 'English')).toBe('English')
  })
})
