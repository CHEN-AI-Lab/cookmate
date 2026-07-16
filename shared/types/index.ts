// ─── CookMate Core Types ───

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'low-carb';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SubscriptionTier = 'free' | 'pro' | 'family';

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
