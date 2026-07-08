// ─── CookMate Shared Messages ───
// 中英文翻译文件入口

export { default as zhCN } from './zh-CN.json';
export { default as en } from './en.json';

export type MessageLocale = 'zh-CN' | 'en';

export const locales = ['zh-CN', 'en'] as const;
export const defaultLocale = 'zh-CN' as const;

export type Messages = typeof import('./zh-CN.json');