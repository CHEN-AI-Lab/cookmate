// ─── CookMate Utility Functions ───

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
}

export function getWeekDates(startDate: string): string[] {
  const start = new Date(startDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function estimateCalories(ingredients: Array<{ amount: number; unit: string; name: string }>): number {
  return Math.round(ingredients.reduce((sum, ing) => sum + ing.amount * 0.5, 0));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(date)
}

export const DAYS_SHORT = ["一", "二", "三", "四", "五", "六", "日"]

export * from './order-id'
export * from './grocery-categories'
