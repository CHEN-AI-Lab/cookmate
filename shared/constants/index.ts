// ─── CookMate Constants ───

export const APP_NAME = 'CookMate';

export const MEAL_TYPES = [
  { value: 'breakfast', labelZh: '早餐', labelEn: 'Breakfast' },
  { value: 'lunch', labelZh: '午餐', labelEn: 'Lunch' },
  { value: 'dinner', labelZh: '晚餐', labelEn: 'Dinner' },
  { value: 'snack', labelZh: '零食', labelEn: 'Snack' },
  { value: 'dessert', labelZh: '甜点', labelEn: 'Dessert' },
] as const;

export const DIETARY_PREFERENCES = [
  { value: 'none', labelZh: '无限制', labelEn: 'No Preference' },
  { value: 'vegetarian', labelZh: '素食', labelEn: 'Vegetarian' },
  { value: 'vegan', labelZh: '纯素', labelEn: 'Vegan' },
  { value: 'keto', labelZh: '生酮', labelEn: 'Keto' },
  { value: 'paleo', labelZh: '原始饮食', labelEn: 'Paleo' },
  { value: 'gluten-free', labelZh: '无麸质', labelEn: 'Gluten-Free' },
  { value: 'low-carb', labelZh: '低碳水', labelEn: 'Low-Carb' },
] as const;

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;

// 订阅层级枚举。**统一用大写**：
// ① 与数据库 User.subscriptionTier 的默认值 "FREE" 一致（Prisma schema）；
// ② 与业务判断 user.subscriptionTier !== "FREE" 一致（auth-helpers.ts）；
// ③ 符合 Prisma 官方枚举规范（enum Role { USER ADMIN }）与 API 枚举 UPPER_SNAKE_CASE 惯例。
// 切勿改回小写 —— 会让常量与数据库实际值对不上，比对时静默失效。
export const SUBSCRIPTION_TIERS = ['FREE', 'PRO', 'FAMILY'] as const;

export const MAX_DAILY_FREE_RECOMMENDATIONS = 1;

export const WORKER_URL =
  (typeof process !== 'undefined' &&
    (process as any).env?.NEXT_PUBLIC_WORKER_URL) || ''
// Must be set via NEXT_PUBLIC_WORKER_URL env var — no hardcoded default.

// Fallback tracking endpoint for users who cannot reach the Worker (e.g. China)
// Sends tracking data directly to the stats-dashboard API.
// Must be set via NEXT_PUBLIC_FALLBACK_URL env var — no hardcoded default.
export const FALLBACK_URL =
  (typeof process !== 'undefined' &&
    (process as any).env?.NEXT_PUBLIC_FALLBACK_URL) || ''

export const API_ROUTES = {
  recipes: '/api/recipes',
  generateRecipe: '/api/recipes/generate',
  mealPlan: '/api/meal-plan',
  groceryList: '/api/grocery-list',
  pantry: '/api/pantry',
  user: '/api/user',
  settings: '/api/settings',
} as const;

export * from './preferences';
export * from './locales';
export * from './meal-plan';
