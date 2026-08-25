// OpenAI 客户端纯函数 + mock 兜底分支测试（无 AI key 时走确定性的 mock 数据）
import { describe, it, expect, beforeEach, vi } from 'vitest'

// 确保测试环境无 AI key，强制走 mock 兜底分支
beforeEach(() => {
  vi.stubEnv('AI_API_KEY', '')
  vi.stubEnv('OPENAI_API_KEY', '')
})

import {
  normalizeIngredients,
  sanitizeRecipe,
  sanitizeWeeklyPlan,
  generateRecipes,
  generateWeeklyPlan,
} from '@cookmate/shared/api/openai'

describe('normalizeIngredients', () => {
  it('字符串数组原样返回', () => {
    expect(normalizeIngredients(['鸡蛋 2个', '盐 适量'])).toEqual(['鸡蛋 2个', '盐 适量'])
  })
  it('对象数组提取 name + quantity', () => {
    expect(normalizeIngredients([{ name: '鸡蛋', quantity: '2个' }, { name: '盐' }])).toEqual(['鸡蛋 2个', '盐'])
  })
  it('混合类型统一转字符串', () => {
    expect(normalizeIngredients(['a', { name: 'b' }, 3])).toEqual(['a', 'b', '3'])
  })
  it('非数组返回空数组', () => {
    expect(normalizeIngredients('鸡蛋' as any)).toEqual([])
    expect(normalizeIngredients(null)).toEqual([])
    expect(normalizeIngredients(undefined)).toEqual([])
  })
})

describe('sanitizeRecipe', () => {
  it('完整对象原样保留', () => {
    const r = { title: '菜', description: 'd', ingredients: ['a'], steps: ['s'], cookingTime: 10, calories: 100, cuisineType: '中餐', difficulty: 'easy' as const }
    expect(sanitizeRecipe(r)).toEqual(r)
  })
  it('undefined/null → 默认值', () => {
    const s = sanitizeRecipe(undefined)
    expect(s.title).toBe('未命名菜谱')
    expect(s.ingredients).toEqual([])
    expect(s.steps).toEqual([])
    expect(s.cookingTime).toBe(0)
    expect(s.calories).toBe(0)
    expect(s.difficulty).toBe('easy')
  })
  it('缺失数字字段补 0，数组字段补空', () => {
    const s = sanitizeRecipe({ title: '菜' })
    expect(s.cookingTime).toBe(0)
    expect(s.calories).toBe(0)
    expect(s.ingredients).toEqual([])
    expect(s.steps).toEqual([])
  })
  it('非数字 cookingTime 补 0', () => {
    expect(sanitizeRecipe({ title: 'x', cookingTime: '快' as any }).cookingTime).toBe(0)
  })
})

describe('sanitizeWeeklyPlan', () => {
  it('null/undefined → 空对象', () => {
    expect(sanitizeWeeklyPlan(null)).toEqual({})
    expect(sanitizeWeeklyPlan(undefined)).toEqual({})
  })
  it('缺失某餐 → 该餐默认值', () => {
    const p = sanitizeWeeklyPlan({ 周一: { lunch: { title: '饭' } } })
    expect(p['周一'].breakfast.title).toBe('未命名菜谱')
    expect(p['周一'].lunch.title).toBe('饭')
    expect(p['周一'].dinner.title).toBe('未命名菜谱')
  })
  it('完整计划逐餐消毒', () => {
    const raw = {
      周一: {
        breakfast: { title: '早', ingredients: ['a'], steps: ['s'], cookingTime: 5, calories: 100, cuisineType: '中', difficulty: 'easy' },
        lunch: { title: '午', ingredients: ['b'], steps: ['s2'] },
        dinner: { title: '晚' },
      },
    }
    const out = sanitizeWeeklyPlan(raw)
    expect(out['周一'].breakfast.cookingTime).toBe(5)
    expect(out['周一'].dinner.cookingTime).toBe(0)
  })
})

describe('generateRecipes（无 AI key → mock 兜底）', () => {
  it('中文：返回 mock 菜谱且 fallback=true', async () => {
    const { recipes, fallback } = await generateRecipes(['鸡蛋', '西红柿'], {}, [], 'zh-CN')
    expect(fallback).toBe(true)
    expect(recipes.length).toBeGreaterThan(0)
    expect(recipes[0].title).toBeTruthy()
  })
  it('英文：返回英文 mock 且 fallback=true', async () => {
    const { recipes, fallback } = await generateRecipes(['egg', 'tomato'], {}, [], 'en')
    expect(fallback).toBe(true)
    expect(recipes[0].title).toBeTruthy()
  })
  it('空食材：返回非空 mock', async () => {
    const { recipes } = await generateRecipes([], {}, [], 'zh-CN')
    expect(recipes.length).toBeGreaterThan(0)
  })
})

describe('generateWeeklyPlan（无 AI key → mock 兜底）', () => {
  it('默认 7 天全部生成，fallback=true', async () => {
    const { plan, fallback } = await generateWeeklyPlan({ servingSize: 2 }, [], 'zh-CN')
    expect(fallback).toBe(true)
    expect(Object.keys(plan).length).toBe(7)
  })
  it('指定 2 天：只返回这 2 天', async () => {
    const { plan } = await generateWeeklyPlan({ servingSize: 2 }, [], 'zh-CN', [0, 1])
    expect(Object.keys(plan).length).toBe(2)
    expect(plan['周一']).toBeTruthy()
    expect(plan['周二']).toBeTruthy()
    expect(plan['周三']).toBeUndefined()
  })
  it('英文 locale：按英文章节名', async () => {
    const { plan } = await generateWeeklyPlan({ servingSize: 2 }, [], 'en', [0])
    expect(plan['Monday']).toBeTruthy()
  })
})
