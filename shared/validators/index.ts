// ─── CookMate Validators ───
import { z } from 'zod';

export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']);

export const dietaryPreferenceSchema = z.enum([
  'none', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten-free', 'low-carb',
]);

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

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

export const passwordSchema = z.string().min(6, '密码至少 6 位').max(100, '密码最多 100 位');

export const setPasswordSchema = z.object({
  password: passwordSchema,
});

export type RecipeGenerateInput = z.infer<typeof recipeGenerateSchema>;
export type MealPlanCreateInput = z.infer<typeof mealPlanCreateSchema>;
export type PantryItemInput = z.infer<typeof pantryItemSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
