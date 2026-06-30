// ─── CookMate Validators ───
import { z } from 'zod';

export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']);

export const dietaryPreferenceSchema = z.enum([
  'none', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten-free', 'low-carb',
]);

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

// 中国手机号校验：1 开头，第二位 3-9，共 11 位
export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号码');

// 常见虚假手机号黑名单（连续数字、重复数字等）
export const FAKE_PHONES = new Set([
  '12345678901', '11111111111', '22222222222', '33333333333',
  '44444444444', '55555555555', '66666666666', '77777777777',
  '88888888888', '99999999999', '00000000000',
  '12345678910', '10987654321', '13579246801',
]);

export const bindPhoneSchema = z.object({
  phone: phoneSchema.refine((val) => !FAKE_PHONES.has(val), {
    message: '请输入真实的手机号码',
  }),
  password: z.string().min(8, '密码至少 8 位'),
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
  .min(8, '密码至少 8 位')
  .max(128, '密码最多 128 位')
  .refine(
    (val) => {
      let types = 0;
      if (/[a-z]/.test(val)) types++;
      if (/[A-Z]/.test(val)) types++;
      if (/[0-9]/.test(val)) types++;
      if (/[^a-zA-Z0-9]/.test(val)) types++;
      return types >= 2;
    },
    { message: '密码需包含至少两种字符类型（大小写字母、数字、符号）' }
  );

// NIST 推荐：禁止常见弱密码
export const COMMON_PASSWORDS = new Set([
  'password1', 'qwerty123', 'qwerty1', 'trustno1',
  'abc12345', '1234qwer', '1q2w3e4r', 'passw0rd', 'admin123',
]);

export const setPasswordSchema = z.object({
  password: passwordSchema.refine(
    (val) => !COMMON_PASSWORDS.has(val.toLowerCase()),
    { message: '密码过于常见，请换一个' }
  ),
});

export type RecipeGenerateInput = z.infer<typeof recipeGenerateSchema>;
export type MealPlanCreateInput = z.infer<typeof mealPlanCreateSchema>;
export type PantryItemInput = z.infer<typeof pantryItemSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
