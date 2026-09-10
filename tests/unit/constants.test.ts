import { describe, it, expect } from 'vitest'
import { MEAL_TYPES, DIETARY_PREFERENCES, DIFFICULTY_LEVELS, SUBSCRIPTION_TIERS, MAX_DAILY_FREE_RECOMMENDATIONS, API_ROUTES, APP_NAME } from '@cookmate/shared/constants'
import { apiError, API_ERRORS } from '@cookmate/shared/constants/api-errors'
import { PRICING } from '@cookmate/shared/constants/pricing'
import { DIET_OPTIONS, CUISINE_OPTIONS, SERVING_SIZE_OPTIONS } from '@cookmate/shared/constants/preferences'
import { INGREDIENT_LABELS, displayIngredient, displayQuantity } from '@cookmate/shared/constants/ingredients'
import { isChineseLocale } from '@cookmate/shared/constants/locales'
import { getDemoPantryItems, getDemoGroceryList, displaySourceTitle, getDemoRecipes, getDemoMealPlan } from '@cookmate/shared/demo-data'

describe('APP_NAME', () => {
  it('is CookMate', () => {
    expect(APP_NAME).toBe('CookMate')
  })
})

describe('MEAL_TYPES', () => {
  it('has 5 meal types', () => {
    expect(MEAL_TYPES).toHaveLength(5)
  })

  it('includes breakfast, lunch, dinner', () => {
    const values = MEAL_TYPES.map(m => m.value)
    expect(values).toContain('breakfast')
    expect(values).toContain('lunch')
    expect(values).toContain('dinner')
  })

  it('each entry has zh and en labels', () => {
    for (const m of MEAL_TYPES) {
      expect(m).toHaveProperty('labelZh')
      expect(m).toHaveProperty('labelEn')
      expect(typeof m.labelZh).toBe('string')
      expect(typeof m.labelEn).toBe('string')
    }
  })
})

describe('DIETARY_PREFERENCES', () => {
  it('has exactly 7 dietary preference options', () => {
    expect(DIETARY_PREFERENCES).toHaveLength(7)
  })

  it('includes common diets', () => {
    const values = DIETARY_PREFERENCES.map(d => d.value)
    expect(values).toContain('vegetarian')
    expect(values).toContain('vegan')
    expect(values).toContain('keto')
    expect(values).toContain('none')
  })

  it('each entry has bilingual labels', () => {
    for (const d of DIETARY_PREFERENCES) {
      expect(d).toHaveProperty('labelZh')
      expect(d).toHaveProperty('labelEn')
    }
  })
})

describe('DIFFICULTY_LEVELS', () => {
  it('has 3 levels', () => {
    expect(DIFFICULTY_LEVELS).toHaveLength(3)
    expect(DIFFICULTY_LEVELS).toEqual(['easy', 'medium', 'hard'])
  })
})

describe('SUBSCRIPTION_TIERS', () => {
  it('has 3 tiers', () => {
    expect(SUBSCRIPTION_TIERS).toHaveLength(3)
    expect(SUBSCRIPTION_TIERS).toContain('FREE')
    expect(SUBSCRIPTION_TIERS).toContain('PRO')
    expect(SUBSCRIPTION_TIERS).toContain('FAMILY')
  })
})

describe('MAX_DAILY_FREE_RECOMMENDATIONS', () => {
  it('is 1 per day', () => {
    expect(MAX_DAILY_FREE_RECOMMENDATIONS).toBe(1)
  })
})

describe('API_ROUTES', () => {
  it('defines all API endpoints', () => {
    expect(API_ROUTES.recipes).toBe('/api/recipes')
    expect(API_ROUTES.generateRecipe).toBe('/api/recipes/generate')
    expect(API_ROUTES.mealPlan).toBe('/api/meal-plan')
    expect(API_ROUTES.groceryList).toBe('/api/grocery-list')
    expect(API_ROUTES.pantry).toBe('/api/pantry')
    expect(API_ROUTES.user).toBe('/api/user')
    expect(API_ROUTES.settings).toBe('/api/settings')
  })
})

describe('apiError', () => {
  it('returns English for en locale', () => {
    expect(apiError('loginRequired', 'en')).toContain('log in')
  })

  it('returns Chinese for zh locale', () => {
    expect(apiError('loginRequired', 'zh-CN')).toContain('登录')
  })

  it('handles en- prefixed locales', () => {
    expect(apiError('userNotFound', 'en-US')).toBe(API_ERRORS.userNotFound.en)
  })

  it('returns key for invalid keys', () => {
    // @ts-expect-error - testing invalid key at runtime
    expect(apiError('no_such_key', 'en')).toBe('no_such_key')
  })
})

describe('PRICING', () => {
  it('has 4 plans with both currencies', () => {
    const plans = PRICING.plans
    for (const period of ['monthly', 'quarterly', 'semiannual', 'annual'] as const) {
      expect(plans[period].cny.amount).toBeGreaterThan(0)
      expect(plans[period].usd.amount).toBeGreaterThan(0)
      expect(plans[period].cny.display).toBeTruthy()
    }
  })

  it('get() returns CNY by default', () => {
    expect(PRICING.get('monthly')).toBe(PRICING.plans.monthly.cny)
  })

  it('get() returns USD when requested', () => {
    expect(PRICING.get('annual', 'USD')).toBe(PRICING.plans.annual.usd)
  })

  it('annual plans cost less per period than monthly', () => {
    expect(PRICING.plans.annual.cny.amount).toBeLessThan(PRICING.plans.monthly.cny.amount * 12)
  })
})

describe('preferences', () => {
  it('has diet options', () => {
    expect(DIET_OPTIONS.length).toBeGreaterThan(3)
  })

  it('has cuisine options', () => {
    expect(CUISINE_OPTIONS.length).toBeGreaterThan(3)
  })

  it('has serving sizes 1-6', () => {
    expect(SERVING_SIZE_OPTIONS).toEqual([1, 2, 3, 4, 5, 6])
  })
})


describe('ingredients 显示辅助（体验版 i18n 回归）', () => {
  it('isChineseLocale 只认 zh 开头的语系', () => {
    expect(isChineseLocale('zh-CN')).toBe(true)
    expect(isChineseLocale('zh-TW')).toBe(true)
    expect(isChineseLocale('en')).toBe(false)
    expect(isChineseLocale('ja')).toBe(false)
  })

  it('displayIngredient 中文语系保留原文', () => {
    expect(displayIngredient('番茄', 'zh-CN')).toBe('番茄')
    expect(displayIngredient('番茄', 'zh-TW')).toBe('番茄')
  })

  it('displayIngredient 非中文语系转英文', () => {
    expect(displayIngredient('番茄', 'en')).toBe('Tomato')
    expect(displayIngredient('鸡胸肉', 'ja')).toBe('Chicken Breast')
  })

  it('displayIngredient 未收录的自由文本与空值原样返回', () => {
    expect(displayIngredient('奶奶的秘制酱', 'en')).toBe('奶奶的秘制酱')
    expect(displayIngredient('', 'en')).toBe('')
  })

  it('示例食材库的食材全部有英文映射', () => {
    const missing = getDemoPantryItems()
      .map((i) => i.name)
      .filter((n) => displayIngredient(n, 'en') === n)
    expect(missing).toEqual([])
  })

  it('示例购物清单的食材全部有英文映射', () => {
    const { categories, stapleItems } = getDemoGroceryList()
    const names = new Set<string>(stapleItems)
    for (const cat of categories) for (const item of cat.items) names.add(item.name)
    const missing = [...names].filter((n) => displayIngredient(n, 'en') === n)
    expect(missing).toEqual([])
  })

  it('displayQuantity 带数字前缀时按单复数转换', () => {
    expect(displayQuantity('1罐', 'en')).toBe('1 can')
    expect(displayQuantity('3个', 'en')).toBe('3 pcs')
    expect(displayQuantity('300克', 'en')).toBe('300 g')
  })

  it('displayQuantity 多字单位不被单字抢先命中', () => {
    expect(displayQuantity('1千克', 'en')).toBe('1 kg')
    expect(displayQuantity('500毫升', 'en')).toBe('500 ml')
  })

  it('displayQuantity 处理无数字前缀单位与中文语系', () => {
    expect(displayQuantity('适量', 'en')).toBe('to taste')
    expect(displayQuantity('1罐', 'zh-CN')).toBe('1罐')
  })

  it('INGREDIENT_LABELS 无重复或空值', () => {
    for (const [zh, en] of Object.entries(INGREDIENT_LABELS)) {
      expect(zh.trim().length).toBeGreaterThan(0)
      expect(en.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('grocery 来源标题显示（体验版 i18n 回归）', () => {
  it('中文语系原样返回', () => {
    expect(displaySourceTitle('宫保鸡丁（周一午餐）', 'zh-CN')).toBe('宫保鸡丁（周一午餐）')
    expect(displaySourceTitle('宫保鸡丁（周一午餐）', 'zh-TW')).toBe('宫保鸡丁（周一午餐）')
  })

  it('非中文语系拼成「英文菜名 (周次 餐次)」', () => {
    expect(displaySourceTitle('宫保鸡丁（周一午餐）', 'en')).toBe('Kung Pao Chicken (Mon lunch)')
    expect(displaySourceTitle('红烧排骨（周二午餐）', 'ja')).toBe('Braised Spare Ribs (Tue lunch)')
    expect(displaySourceTitle('麻婆豆腐（周三晚餐）', 'en')).toBe('Mapo Tofu (Wed dinner)')
  })

  it('认不出菜名或格式时原样返回，不臆造翻译', () => {
    expect(displaySourceTitle('奶奶的秘制酱（周一午餐）', 'en')).toBe('奶奶的秘制酱（周一午餐）')
    expect(displaySourceTitle('宫保鸡丁', 'en')).toBe('宫保鸡丁')
    expect(displaySourceTitle('', 'en')).toBe('')
  })

  it('示例购物清单的来源标题全部可翻译成英文', () => {
    const { categories } = getDemoGroceryList()
    const missing: string[] = []
    for (const cat of categories) {
      for (const item of cat.items) {
        for (const s of item.sources) {
          if (displaySourceTitle(s.title, 'en') === s.title) missing.push(s.title)
        }
      }
    }
    expect(missing).toEqual([])
  })
})

describe('示例菜谱/周计划：非中文语系一律英文（体验模式语言口径）', () => {
  it('getDemoRecipes：ja 英文、zh-TW 中文、zh-CN 中文', () => {
    expect(getDemoRecipes('ja')[0].title).toMatch(/^[A-Za-z]/)
    expect(getDemoRecipes('zh-TW')[0].title).toMatch(/[一-龥]/)
    expect(getDemoRecipes('zh-CN')[0].title).toMatch(/[一-龥]/)
    expect(getDemoRecipes('en')[0].title).toMatch(/^[A-Za-z]/)
  })

  it('getDemoMealPlan：ja 全英文、zh-TW 全中文', () => {
    const jaTitles = getDemoMealPlan('ja').slots.map((s) => s.recipe?.title || '').filter(Boolean)
    expect(jaTitles.length).toBeGreaterThan(0)
    for (const t of jaTitles) expect(t).toMatch(/^[A-Za-z]/)

    const zhTitles = getDemoMealPlan('zh-TW').slots.map((s) => s.recipe?.title || '').filter(Boolean)
    expect(zhTitles.length).toBeGreaterThan(0)
    for (const t of zhTitles) expect(t).toMatch(/[一-龥]/)
  })
})
