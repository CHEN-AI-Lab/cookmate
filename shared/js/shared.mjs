// ─── CookMate Shared JS 版本 ───
// 供非 TypeScript 平台使用（如微信小程序）
// 用法: const { t, locales } = require('./shared.mjs')
// 或: import { t, locales } from './shared.mjs'

import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// 语言配置
export const locales = ['zh-CN', 'en']
export const defaultLocale = 'en'

// 翻译消息
const zhCN = require(resolve(__dirname, '../messages/zh-CN.json'))
const en = require(resolve(__dirname, '../messages/en.json'))

const messageMap = { 'zh-CN': zhCN, 'en': en }

/**
 * 根据语言和 key 路径获取翻译文本。
 * @param {string} locale - 语言代码
 * @param {string} path - 点分隔 key 路径
 * @param {string} [fallback] - 兜底文本
 * @returns {string}
 */
export function t(locale, path, fallback) {
  const msg = messageMap[locale] || messageMap['zh-CN']
  if (!msg) return fallback ?? path

  const keys = path.split('.')
  let val = msg
  for (const key of keys) {
    if (val && typeof val === 'object' && key in val) {
      val = val[key]
    } else {
      return fallback ?? path
    }
  }
  return typeof val === 'string' ? val : (fallback ?? path)
}