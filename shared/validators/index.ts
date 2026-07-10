// ─── CookMate Validators ───
// 错误消息统一使用英文 + message key，API 路由再根据 locale 翻译
import { z } from 'zod';

export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']);

export const dietaryPreferenceSchema = z.enum([
  'none', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten-free', 'low-carb',
]);

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, 'invalid_phone');

export const FAKE_PHONES = new Set([
  '12345678901', '11111111111', '22222222222', '33333333333',
  '44444444444', '55555555555', '66666666666', '77777777777',
  '88888888888', '99999999999', '00000000000',
  '12345678910', '10987654321', '13579246801',
]);

export const bindPhoneSchema = z.object({
  phone: phoneSchema
    .refine((val) => !FAKE_PHONES.has(val), { message: 'invalid_phone_real' })
    .refine((val) => !/^1(\d)\1{9}$/.test(val), { message: 'invalid_phone_real' }),
  password: z.string().min(8, 'password_too_short'),
});

export const recipeGenerateSchema = z.object({
  mealType: mealTypeSchema.optional(),
  dietaryPreference: dietaryPreferenceSchema.optional().default('none'),
  cuisine: z.string().max(50).optional(),
  ingredients: z.array(z.string()).max(20).optional(),
  maxTime: z.number().positive().max(480).optional(),
  servings: z.number().int().positive().max(20).optional(),
  locale: z.enum(['zh-CN', 'en']).default('zh-CN'),
});

export const mealPlanSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: mealTypeSchema,
  recipeId: z.string().min(1),
});

export const mealPlanCreateSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(mealPlanSlotSchema).min(1).max(35),
});

export const pantryItemSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  unit: z.string().min(1).max(20),
  category: z.string().min(1).max(50),
  expiryDate: z.string().optional(),
});

export const passwordSchema = z
  .string()
  .min(8, 'password_too_short')
  .max(128, 'password_too_long')
  .refine(
    (val) => {
      let types = 0;
      if (/[a-z]/.test(val)) types++;
      if (/[A-Z]/.test(val)) types++;
      if (/[0-9]/.test(val)) types++;
      if (/[^a-zA-Z0-9]/.test(val)) types++;
      return types >= 2;
    },
    { message: 'password_needs_character_types' }
  );

export const COMMON_PASSWORDS = new Set([
  'password1', 'qwerty123', 'qwerty1', 'trustno1',
  'abc12345', '1234qwer', '1q2w3e4r', 'passw0rd', 'admin123',
]);

export const setPasswordSchema = z.object({
  password: passwordSchema.refine(
    (val) => !COMMON_PASSWORDS.has(val.toLowerCase()),
    { message: 'password_common' }
  ),
});

// ─── 错误消息翻译表 ───
export const VALIDATION_MESSAGES: Record<string, { zh: string; en: string }> = {
  invalid_phone:            { zh: '请输入正确的手机号码',              en: 'Please enter a valid phone number' },
  invalid_phone_real:       { zh: '请输入真实的手机号码',              en: 'Please enter a real phone number' },
  password_too_short:       { zh: '密码至少 8 位',                    en: 'Password must be at least 8 characters' },
  password_too_long:        { zh: '密码最多 128 位',                  en: 'Password must be at most 128 characters' },
  password_needs_character_types: { zh: '密码需包含至少两种字符类型（大小写字母、数字、符号）', en: 'Password must contain at least 2 character types (uppercase, lowercase, numbers, symbols)' },
  password_common:          { zh: '密码过于常见，请换一个',           en: 'This password is too common, please choose another' },
};

export function translateValidationError(key: string, locale: string): string {
  const msg = VALIDATION_MESSAGES[key];
  if (!msg) return key;
  return locale === 'en' || locale.startsWith('en') ? msg.en : msg.zh;
}

export function translateZodErrors(errors: { message: string }[], locale: string): string[] {
  return errors.map((e) => translateValidationError(e.message, locale));
}

export type RecipeGenerateInput = z.infer<typeof recipeGenerateSchema>;
export type MealPlanCreateInput = z.infer<typeof mealPlanCreateSchema>;
export type PantryItemInput = z.infer<typeof pantryItemSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;