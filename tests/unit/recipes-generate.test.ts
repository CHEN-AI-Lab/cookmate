// recipes/generate 路由测试：鉴权、saveOnly、AI 生成、黑名单、异常
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'
import { getBlockReason } from '@cookmate/shared/constants/ingredients'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/auth-helpers', () => ({
  checkUsageLimit: vi.fn(async () => true),
  incrementUsage: vi.fn(async () => {}),
  isDemoUser: vi.fn(() => false),
}))
vi.mock('@cookmate/shared/api/openai', () => ({
  generateRecipes: vi.fn(),
  normalizeIngredients: (x: unknown) => (Array.isArray(x) ? x.map(String) : (x ? [String(x)] : [])),
}))

import { auth } from '@/lib/auth'
import { generateRecipes } from '@cookmate/shared/api/openai'
import { POST } from '@/app/api/recipes/generate/route'

function req(body: any, cookie = '') {
  return new Request('http://localhost/api/recipes/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrisma()
  ;(auth as any).mockResolvedValue({ user: { id: 'u1' } })
  ;(generateRecipes as any).mockReset()
  stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
})

describe('recipes/generate — 鉴权与校验', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await POST(req({ ingredients: ['鸡蛋'] }))
    expect(res.status).toBe(401)
  })
  it('saveOnly 无标题 → 400', async () => {
    const res = await POST(req({ saveOnly: true, title: '   ' }))
    expect(res.status).toBe(400)
  })
  it('普通生成：食材为空 → 400', async () => {
    const res = await POST(req({ ingredients: [] }))
    expect(res.status).toBe(400)
  })
  it('普通生成：食材超过 20 → 400', async () => {
    const res = await POST(req({ ingredients: Array.from({ length: 21 }, (_, i) => `食材${i}`) }))
    expect(res.status).toBe(400)
  })
  it('普通生成：命中黑名单（毒品类"大麻"）→ 400', async () => {
    const res = await POST(req({ ingredients: ['大麻'] }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.invalidIngredients).toContain('大麻')
  })
  it('普通生成：命中黑名单（非食材"石头"）→ 400', async () => {
    const res = await POST(req({ ingredients: ['石头'] }))
    expect(res.status).toBe(400)
  })
})

describe('recipes/generate — saveOnly', () => {
  it('已存在同名（不区分大小写）→ 切换 starred（update）', async () => {
    stores.recipes.set('existing1', { id: 'existing1', userId: 'u1', title: '宫保鸡丁', starred: false })
    const res = await POST(req({ saveOnly: true, title: '宫保鸡丁', starred: true }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.recipe.id).toBe('existing1')
    expect(json.recipe.starred).toBe(true)
  })
  it('不存在 → 新建 recipe（create）', async () => {
    const res = await POST(req({ saveOnly: true, title: '我的新菜', description: '好吃', ingredients: ['a', 'b'], steps: ['1', '2'], cookingTime: 10, calories: 100, cuisineType: '中餐', difficulty: 'easy' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.recipe.title).toBe('我的新菜')
    expect(json.recipe.id).toBeTruthy()
    expect(prismaMock.recipe.create).toHaveBeenCalled()
  })
})

describe('recipes/generate — AI 生成', () => {
  it('正常生成 → 保存并返回 recipes + fallback', async () => {
    ;(generateRecipes as any).mockResolvedValue({
      recipes: [{ title: '测试菜', description: 'd', ingredients: ['鸡蛋 1个'], steps: ['炒'], cookingTime: 5, calories: 100, cuisineType: '中餐', difficulty: 'easy' }],
      fallback: false,
    })
    const res = await POST(req({ ingredients: ['鸡蛋'], cookie: 'NEXT_LOCALE=zh-CN' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.recipes.length).toBe(1)
    expect(prismaMock.recipe.create).toHaveBeenCalled()
  })
  it('AI 返回空数组 → 兜底 mock（fallback=true）仍返回', async () => {
    ;(generateRecipes as any).mockResolvedValue({ recipes: [], fallback: true })
    const res = await POST(req({ ingredients: ['鸡蛋'] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.fallback).toBe(true)
  })
  it('保存时 DB 抛非 P2002 错误 → 500', async () => {
    ;(generateRecipes as any).mockResolvedValue({
      recipes: [{ title: '测试菜', ingredients: [], steps: [], cookingTime: 0, calories: 0, cuisineType: '', difficulty: 'easy' }],
      fallback: false,
    })
    ;(prismaMock.recipe.create as any).mockRejectedValueOnce(new Error('db down'))
    const res = await POST(req({ ingredients: ['鸡蛋'] }))
    expect(res.status).toBe(500)
  })
})

describe('getBlockReason（黑名单文案）', () => {
  it('毒品类命中', () => {
    expect(getBlockReason(['大麻'], 'zh-CN')).toContain('违禁品')
  })
  it('虚构类命中', () => {
    expect(getBlockReason(['恐龙'], 'zh-CN')).toContain('不是真实存在')
  })
  it('英文文案', () => {
    expect(getBlockReason(['drug'], 'en')).toContain('prohibited')
  })
})
