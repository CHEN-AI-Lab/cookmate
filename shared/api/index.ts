// ─── CookMate API Client ───

import type { Recipe, MealPlan, GroceryItem, PantryItem } from '../types';

const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error: ${res.status}`);
  }
  return res.json();
}

export const recipesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Recipe[]>(`/recipes${qs}`);
  },
  get: (id: string) => request<Recipe>(`/recipes/${id}`),
  generate: (data: Record<string, unknown>) =>
    request<Recipe>('/recipes/generate', { method: 'POST', body: JSON.stringify(data) }),
  star: (id: string) =>
    request<void>(`/recipes/${id}/star`, { method: 'POST' }),
};

export const mealPlanApi = {
  get: (weekStart: string) => request<MealPlan>(`/meal-plan?weekStart=${weekStart}`),
  create: (data: Record<string, unknown>) =>
    request<MealPlan>('/meal-plan', { method: 'POST', body: JSON.stringify(data) }),
  delete: (date: string, mealType: string) =>
    request<void>(`/meal-plan?date=${date}&mealType=${mealType}`, { method: 'DELETE' }),
  addSlot: (data: Record<string, unknown>) =>
    request<MealPlan>('/meal-plan/slot', { method: 'POST', body: JSON.stringify(data) }),
};

export const pantryApi = {
  list: () => request<PantryItem[]>('/pantry'),
  create: (data: Record<string, unknown>) =>
    request<PantryItem>('/pantry', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<PantryItem>(`/pantry/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/pantry/${id}`, { method: 'DELETE' }),
};

export const groceryApi = {
  get: () => request<GroceryItem[]>('/grocery-list'),
  purchase: (data: { items: string[] }) =>
    request<void>('/grocery-list/purchase', { method: 'POST', body: JSON.stringify(data) }),
};
