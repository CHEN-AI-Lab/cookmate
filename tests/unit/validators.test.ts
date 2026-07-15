import { describe, it, expect } from 'vitest'
import {
  phoneSchema,
  dietaryPreferenceSchema,
  mealTypeSchema,
  difficultySchema,
  passwordSchema,
  setPasswordSchema,
  recipeGenerateSchema,
  mealPlanCreateSchema,
  mealPlanSlotSchema,
  pantryItemSchema,
  bindPhoneSchema,
  FAKE_PHONES,
  COMMON_PASSWORDS,
} from '@cookmate/shared/validators'

describe('phoneSchema', () => {
  it('accepts valid Chinese phone numbers', () => {
    expect(phoneSchema.safeParse('13800138000').success).toBe(true)
    expect(phoneSchema.safeParse('15912345678').success).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    expect(phoneSchema.safeParse('12345678901').success).toBe(false)
    expect(phoneSchema.safeParse('123').success).toBe(false)
    expect(phoneSchema.safeParse('').success).toBe(false)
  })
})

describe('FAKE_PHONES', () => {
  it('contains common fake phone numbers', () => {
    expect(FAKE_PHONES.has('12345678901')).toBe(true)
    expect(FAKE_PHONES.has('11111111111')).toBe(true)
  })
})

describe('dietaryPreferenceSchema', () => {
  it('accepts valid diet types', () => {
    expect(dietaryPreferenceSchema.safeParse('vegetarian').success).toBe(true)
    expect(dietaryPreferenceSchema.safeParse('vegan').success).toBe(true)
    expect(dietaryPreferenceSchema.safeParse('keto').success).toBe(true)
  })

  it('rejects invalid diet types', () => {
    expect(dietaryPreferenceSchema.safeParse('carnivore').success).toBe(false)
  })
})

describe('mealTypeSchema', () => {
  it('accepts valid meal types', () => {
    expect(mealTypeSchema.safeParse('breakfast').success).toBe(true)
    expect(mealTypeSchema.safeParse('lunch').success).toBe(true)
  })

  it('rejects invalid meal types', () => {
    expect(mealTypeSchema.safeParse('brunch').success).toBe(false)
  })
})

describe('difficultySchema', () => {
  it('accepts valid difficulties', () => {
    expect(difficultySchema.safeParse('easy').success).toBe(true)
    expect(difficultySchema.safeParse('medium').success).toBe(true)
    expect(difficultySchema.safeParse('hard').success).toBe(true)
  })

  it('rejects invalid difficulties', () => {
    expect(difficultySchema.safeParse('expert').success).toBe(false)
  })
})

describe('passwordSchema', () => {
  it('accepts valid passwords (8+ chars, 2 types)', () => {
    expect(passwordSchema.safeParse('Abcd1234').success).toBe(true)
    expect(passwordSchema.safeParse('MyPass123!').success).toBe(true)
  })

  it('rejects short passwords', () => {
    expect(passwordSchema.safeParse('Ab1').success).toBe(false)
  })

  it('rejects passwords with only one character type', () => {
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false)
    expect(passwordSchema.safeParse('12345678').success).toBe(false)
  })
})

describe('setPasswordSchema', () => {
  it('accepts valid passwords', () => {
    expect(setPasswordSchema.safeParse({ password: 'ValidP@ss123' }).success).toBe(true)
  })

  it('rejects common weak passwords', () => {
    expect(setPasswordSchema.safeParse({ password: 'password1' }).success).toBe(false)
    expect(setPasswordSchema.safeParse({ password: 'admin123' }).success).toBe(false)
  })
})

describe('COMMON_PASSWORDS', () => {
  it('contains known weak passwords', () => {
    expect(COMMON_PASSWORDS.has('password1')).toBe(true)
    expect(COMMON_PASSWORDS.has('qwerty123')).toBe(true)
  })
})

describe('recipeGenerateSchema', () => {
  it('accepts minimal valid input', () => {
    const result = recipeGenerateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts full valid input', () => {
    const result = recipeGenerateSchema.safeParse({
      mealType: 'lunch',
      dietaryPreference: 'vegetarian',
      cuisine: '川菜',
      ingredients: ['土豆', '胡萝卜'],
      maxTime: 30,
      servings: 2,
    })
    expect(result.success).toBe(true)
  })

  it('applies default values', () => {
    const result = recipeGenerateSchema.parse({})
    expect(result.dietaryPreference).toBe('none')
    expect(result.locale).toBe('zh-CN')
  })
})

describe('mealPlanSlotSchema', () => {
  it('accepts valid slot', () => {
    expect(mealPlanSlotSchema.safeParse({
      date: '2026-07-06',
      mealType: 'lunch',
      recipeId: 'recipe-1',
    }).success).toBe(true)
  })

  it('rejects invalid date format', () => {
    expect(mealPlanSlotSchema.safeParse({
      date: '07/06/2026',
      mealType: 'lunch',
      recipeId: 'r1',
    }).success).toBe(false)
  })
})

describe('mealPlanCreateSchema', () => {
  it('accepts valid meal plan', () => {
    expect(mealPlanCreateSchema.safeParse({
      weekStart: '2026-07-06',
      slots: [{ date: '2026-07-06', mealType: 'lunch', recipeId: 'r1' }],
    }).success).toBe(true)
  })

  it('rejects empty slots', () => {
    expect(mealPlanCreateSchema.safeParse({
      weekStart: '2026-07-06',
      slots: [],
    }).success).toBe(false)
  })
})

describe('pantryItemSchema', () => {
  it('accepts valid pantry item', () => {
    expect(pantryItemSchema.safeParse({
      name: '土豆',
      amount: 500,
      unit: 'g',
      category: '蔬菜',
    }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(pantryItemSchema.safeParse({
      name: '',
      amount: 1,
      unit: '个',
      category: '其他',
    }).success).toBe(false)
  })
})

describe('bindPhoneSchema', () => {
  it('accepts valid phone + password', () => {
    expect(bindPhoneSchema.safeParse({
      phone: '13800138000',
      password: 'Abcd1234',
    }).success).toBe(true)
  })

  it('rejects fake phone number', () => {
    const result = bindPhoneSchema.safeParse({
      phone: '11111111111',
      password: 'Abcd1234',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = bindPhoneSchema.safeParse({
      phone: '13800138000',
      password: 'Ab1',
    })
    expect(result.success).toBe(false)
  })
})