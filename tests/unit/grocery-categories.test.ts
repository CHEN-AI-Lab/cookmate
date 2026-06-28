import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  STAPLE_EXCLUSIONS,
  DISH_DECOMPOSE_MAP,
  isStaple,
  decomposeDishName,
  classifyIngredient,
  normalizeIngredientName,
} from '../../lib/grocery-categories'

describe('CATEGORIES', () => {
  it('has predefined categories (10 types)', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true)
    expect(CATEGORIES.length).toBe(10)
  })

  it('each category is a non-empty string with emoji prefix', () => {
    for (const cat of CATEGORIES) {
      expect(typeof cat).toBe('string')
      expect(cat.length).toBeGreaterThan(2)
    }
  })

  it('includes vegetable category', () => {
    expect(CATEGORIES).toContain('🥬 蔬菜水果')
  })

  it('includes meat category', () => {
    expect(CATEGORIES).toContain('🥩 肉禽蛋')
  })
})

describe('classifyIngredient', () => {
  it('classifies common ingredients to correct categories', () => {
    expect(classifyIngredient('白菜')).toBe('🥬 蔬菜水果')
    expect(classifyIngredient('猪肉')).toBe('🥩 肉禽蛋')
    expect(classifyIngredient('基围虾')).toBe('🦐 海鲜水产')
    expect(classifyIngredient('豆腐')).toBe('🥛 乳品豆制品')
    expect(classifyIngredient('大米')).toBe('🍚 粮油米面')
    expect(classifyIngredient('盐')).toBe('🧂 调味佐料')
  })

  it('excludes items in excludeKeywords', () => {
    // Tomato sauce should NOT be classified as vegetable
    expect(classifyIngredient('番茄酱')).toBe('🧂 调味佐料')
  })

  it('returns 其他 for unknown items', () => {
    expect(classifyIngredient('完全不存在的物品xxx')).toBe('其他')
  })
})

describe('normalizeIngredientName', () => {
  it('removes quantity suffixes', () => {
    expect(normalizeIngredientName('白菜1颗')).toBe('白菜')
    expect(normalizeIngredientName('猪肉500g')).toBe('猪肉')
    expect(normalizeIngredientName('大蒜3瓣')).toBe('大蒜')
  })

  it('removes parenthetical weights', () => {
    expect(normalizeIngredientName('豆腐(300g)')).toBe('豆腐')
    expect(normalizeIngredientName('牛肉(1斤)')).toBe('牛肉')
  })

  it('handles multiple quantity layers', () => {
    expect(normalizeIngredientName('豆腐一块200g')).toBe('豆腐')
  })

  it('returns trimmed input when no quantity found', () => {
    expect(normalizeIngredientName('  鸡蛋  ')).toBe('鸡蛋')
  })
})

describe('isStaple', () => {
  it('identifies basic staples', () => {
    expect(isStaple('盐')).toBe(true)
    expect(isStaple('糖')).toBe(true)
    expect(isStaple('生抽')).toBe(true)
  })

  it('identifies no as non-staple', () => {
    expect(isStaple('白菜')).toBe(false)
    expect(isStaple('猪肉')).toBe(false)
  })
})

describe('decomposeDishName', () => {
  it('decomposes known dishes to ingredients', () => {
    expect(decomposeDishName('红烧肉')).toEqual(['五花肉'])
    expect(decomposeDishName('酸辣土豆丝')).toEqual(['土豆'])
    expect(decomposeDishName('麻婆豆腐')).toEqual(['豆腐'])
  })

  it('returns the original name for unknown dishes', () => {
    expect(decomposeDishName('未知菜肴')).toEqual(['未知菜肴'])
  })
})

describe('STAPLE_EXCLUSIONS', () => {
  it('has exclusions for basic seasonings', () => {
    expect(STAPLE_EXCLUSIONS).toContain('盐')
    expect(STAPLE_EXCLUSIONS).toContain('生抽')
  })
})

describe('DISH_DECOMPOSE_MAP', () => {
  it('has entries for common dishes', () => {
    expect(DISH_DECOMPOSE_MAP['番茄炒蛋']).toBeDefined()
    expect(DISH_DECOMPOSE_MAP['红烧肉']).toBeDefined()
  })
})