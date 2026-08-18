import { describe, it, expect } from 'vitest';
import {
  mealTypeSchema,
  dietaryPreferenceSchema,
  difficultySchema,
  phoneSchema,
  bindPhoneSchema,
  recipeGenerateSchema,
  mealPlanCreateSchema,
  pantryItemSchema,
  passwordSchema,
  setPasswordSchema,
  translateValidationError,
  translateZodErrors,
} from '../../validators/index';

describe('enum schemas', () => {
  it('accepts valid meal types', () => {
    for (const type of ['breakfast', 'lunch', 'dinner', 'snack', 'dessert']) {
      expect(mealTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it('rejects invalid meal types', () => {
    expect(mealTypeSchema.safeParse('brunch').success).toBe(false);
  });

  it('accepts valid dietary preferences', () => {
    expect(dietaryPreferenceSchema.safeParse('vegan').success).toBe(true);
    expect(dietaryPreferenceSchema.safeParse('none').success).toBe(true);
  });

  it('accepts valid difficulties', () => {
    for (const d of ['easy', 'medium', 'hard']) {
      expect(difficultySchema.safeParse(d).success).toBe(true);
    }
  });
});

describe('phoneSchema', () => {
  it('accepts valid Chinese phone numbers', () => {
    expect(phoneSchema.safeParse('13800138000').success).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(phoneSchema.safeParse('12345').success).toBe(false);
    expect(phoneSchema.safeParse('abcdefghijk').success).toBe(false);
  });
});

describe('bindPhoneSchema', () => {
  it('rejects fake phone numbers', () => {
    const result = bindPhoneSchema.safeParse({ phone: '12345678901', password: 'StrongPass123' });
    expect(result.success).toBe(false);
  });

  it('rejects repeated-digit numbers', () => {
    const result = bindPhoneSchema.safeParse({ phone: '11111111111', password: 'StrongPass123' });
    expect(result.success).toBe(false);
  });

  it('accepts a real-looking phone with strong password', () => {
    const result = bindPhoneSchema.safeParse({ phone: '13800138000', password: 'StrongPass123' });
    expect(result.success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = bindPhoneSchema.safeParse({ phone: '13800138000', password: 'short' });
    expect(result.success).toBe(false);
  });
});

describe('recipeGenerateSchema', () => {
  it('accepts minimal input with defaults', () => {
    const result = recipeGenerateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('defaults locale to zh-CN', () => {
    const result = recipeGenerateSchema.safeParse({});
    expect(result.success && result.data.locale).toBe('zh-CN');
  });

  it('rejects too many ingredients', () => {
    const result = recipeGenerateSchema.safeParse({
      ingredients: Array.from({ length: 21 }, (_, i) => `ing${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative maxTime', () => {
    expect(recipeGenerateSchema.safeParse({ maxTime: -5 }).success).toBe(false);
  });

  it('rejects non-integer servings', () => {
    expect(recipeGenerateSchema.safeParse({ servings: 2.5 }).success).toBe(false);
  });
});

describe('mealPlanCreateSchema', () => {
  it('accepts a valid plan', () => {
    const result = mealPlanCreateSchema.safeParse({
      weekStart: '2024-01-01',
      slots: [{ date: '2024-01-01', mealType: 'lunch', recipeId: 'rec1' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects bad date formats', () => {
    const result = mealPlanCreateSchema.safeParse({
      weekStart: '01/01/2024',
      slots: [{ date: '2024-01-01', mealType: 'lunch', recipeId: 'rec1' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty slots', () => {
    const result = mealPlanCreateSchema.safeParse({
      weekStart: '2024-01-01',
      slots: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('pantryItemSchema', () => {
  it('accepts a valid item', () => {
    const result = pantryItemSchema.safeParse({
      name: '西红柿', amount: 3, unit: '个', category: '蔬菜',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = pantryItemSchema.safeParse({
      name: '', amount: 3, unit: '个', category: '蔬菜',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive amount', () => {
    const result = pantryItemSchema.safeParse({
      name: '西红柿', amount: 0, unit: '个', category: '蔬菜',
    });
    expect(result.success).toBe(false);
  });
});

describe('passwordSchema / setPasswordSchema', () => {
  it('rejects short passwords', () => {
    expect(passwordSchema.safeParse('Ab123').success).toBe(false);
  });

  it('rejects single-character-type passwords', () => {
    // lowercase only - only 1 character type
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false);
  });

  it('accepts multi-type passwords', () => {
    expect(passwordSchema.safeParse('abcDEF123').success).toBe(true);
  });

  it('rejects common passwords', () => {
    expect(setPasswordSchema.safeParse({ password: 'password1' }).success).toBe(false);
  });

  it('accepts strong unique passwords', () => {
    expect(setPasswordSchema.safeParse({ password: 'Xy9#kQ2!pL' }).success).toBe(true);
  });
});

describe('translation helpers', () => {
  it('translates known keys to Chinese', () => {
    expect(translateValidationError('invalid_phone', 'zh-CN')).toContain('手机');
  });

  it('translates known keys to English', () => {
    expect(translateValidationError('invalid_phone', 'en')).toContain('phone');
  });

  it('returns key for unknown keys', () => {
    expect(translateValidationError('no_such_key', 'zh-CN')).toBe('no_such_key');
  });

  it('maps zod errors to translated messages', () => {
    const errors = [{ message: 'invalid_phone' }, { message: 'password_too_short' }];
    const translated = translateZodErrors(errors, 'zh-CN');
    expect(translated).toHaveLength(2);
    expect(translated[0]).toContain('手机');
  });
});