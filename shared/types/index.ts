// ─── CookMate Core Types ───

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'low-carb';

export type Difficulty = 'easy' | 'medium' | 'hard';

// SubscriptionTier 统一由 shared/constants/index.ts 定义（从 SUBSCRIPTION_TIER 常量派生，值域 FREE/PRO/FAMILY）。
// 这里原先还留着一份 Stripe 时期的小写版本（'free'|'pro'|'family'），
// 除了与数据库实际值不符，还和 constants 的那份冲突 —— shared/index.ts 同时 export * 两边，
// 触发 TS2308「已经导出同名成员」。已删除。

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  mealType: MealType[];
  dietaryTags: DietaryPreference[];
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  cuisine: string;
  isAI: boolean;
  sourceUrl?: string;
  createdAt: string;
  authorId?: string;
  stars: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;
  slots: MealSlot[];
  createdAt: string;
}

export interface MealSlot {
  date: string;
  mealType: MealType;
  recipeId: string;
  recipe?: Recipe;
}

export interface GroceryItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  expiryDate?: string;
}
