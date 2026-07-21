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

export const SUBSCRIPTION_TIERS = ['free', 'pro', 'family'] as const;

export const MAX_DAILY_FREE_RECOMMENDATIONS = 1;

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
export * from './dish-names';
