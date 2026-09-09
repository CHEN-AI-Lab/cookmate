// AI provider 按订阅层级（tier）分流测试
// 免费版与付费版可指向完全不同的厂商：key / baseURL / model 三者各自独立。
// 未配置 *_FREE / *_PRO 时逐级回落到默认 AI_*，保证配置不全也不会让任何用户用不了。
import { describe, it, expect, beforeEach, vi } from 'vitest'

// 所有相关 env 逐条置空，避免用例之间互相污染
const ENV_KEYS = [
  'AI_API_KEY', 'OPENAI_API_KEY', 'AI_BASE_URL', 'AI_MODEL',
  'AI_API_KEY_FREE', 'AI_BASE_URL_FREE', 'AI_MODEL_FREE',
  'AI_API_KEY_PRO', 'AI_BASE_URL_PRO', 'AI_MODEL_PRO',
]

beforeEach(() => {
  for (const k of ENV_KEYS) vi.stubEnv(k, '')
})

import { getModelForTier, hasAIKeyForTier } from '@cookmate/shared/api/openai'

describe('getModelForTier — 模型名按 tier 分流', () => {
  it('FREE 命中 AI_MODEL_FREE', () => {
    vi.stubEnv('AI_MODEL_FREE', 'deepseek-chat')
    vi.stubEnv('AI_MODEL', 'fallback-model')
    expect(getModelForTier('FREE')).toBe('deepseek-chat')
  })

  it('FREE 未配 *_FREE 时回落到 AI_MODEL', () => {
    vi.stubEnv('AI_MODEL', 'fallback-model')
    expect(getModelForTier('FREE')).toBe('fallback-model')
  })

  it('PRO 命中 AI_MODEL_PRO', () => {
    vi.stubEnv('AI_MODEL_PRO', 'gpt-4o')
    vi.stubEnv('AI_MODEL', 'fallback-model')
    expect(getModelForTier('PRO')).toBe('gpt-4o')
  })

  it('PRO 未配 *_PRO 时回落到 AI_MODEL', () => {
    vi.stubEnv('AI_MODEL', 'fallback-model')
    expect(getModelForTier('PRO')).toBe('fallback-model')
  })

  it('FREE 与 PRO 指向不同厂商的不同模型', () => {
    vi.stubEnv('AI_MODEL_FREE', 'deepseek-chat')
    vi.stubEnv('AI_MODEL_PRO', 'gpt-4o')
    expect(getModelForTier('FREE')).toBe('deepseek-chat')
    expect(getModelForTier('PRO')).toBe('gpt-4o')
    expect(getModelForTier('FREE')).not.toBe(getModelForTier('PRO'))
  })

  it('FAMILY 与 PRO 走同一套', () => {
    vi.stubEnv('AI_MODEL_PRO', 'gpt-4o')
    expect(getModelForTier('FAMILY')).toBe(getModelForTier('PRO'))
  })

  it('tier 大小写不敏感', () => {
    vi.stubEnv('AI_MODEL_FREE', 'free-m')
    vi.stubEnv('AI_MODEL_PRO', 'pro-m')
    expect(getModelForTier('free')).toBe('free-m')
    expect(getModelForTier('pro')).toBe('pro-m')
  })

  it('未传 tier 按 FREE 处理（兼容旧调用方）', () => {
    vi.stubEnv('AI_MODEL_FREE', 'free-m')
    expect(getModelForTier()).toBe('free-m')
    expect(getModelForTier(null)).toBe('free-m')
  })

  it('都没配时返回空串', () => {
    expect(getModelForTier('FREE')).toBe('')
    expect(getModelForTier('PRO')).toBe('')
  })
})

describe('hasAIKeyForTier — Key 按 tier 分流', () => {
  it('FREE 有 AI_API_KEY_FREE → true', () => {
    vi.stubEnv('AI_API_KEY_FREE', 'sk-free')
    expect(hasAIKeyForTier('FREE')).toBe(true)
  })

  it('FREE 无 *_FREE 但有 AI_API_KEY → true（回落默认）', () => {
    vi.stubEnv('AI_API_KEY', 'sk-default')
    expect(hasAIKeyForTier('FREE')).toBe(true)
  })

  it('FREE 无 *_FREE 但有 OPENAI_API_KEY → true（兼容旧变量名）', () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-openai')
    expect(hasAIKeyForTier('FREE')).toBe(true)
  })

  it('FREE 全都没配 → false', () => {
    expect(hasAIKeyForTier('FREE')).toBe(false)
  })

  it('PRO 有 AI_API_KEY_PRO → true', () => {
    vi.stubEnv('AI_API_KEY_PRO', 'sk-pro')
    expect(hasAIKeyForTier('PRO')).toBe(true)
  })

  it('PRO 无 *_PRO 但有 AI_API_KEY → true（回落默认）', () => {
    vi.stubEnv('AI_API_KEY', 'sk-default')
    expect(hasAIKeyForTier('PRO')).toBe(true)
  })

  it('PRO 全都没配 → false', () => {
    expect(hasAIKeyForTier('PRO')).toBe(false)
  })

  it('只配了 PRO 端时 FREE 端仍算未配置（两端互不影响）', () => {
    vi.stubEnv('AI_API_KEY_PRO', 'sk-pro')
    expect(hasAIKeyForTier('PRO')).toBe(true)
    expect(hasAIKeyForTier('FREE')).toBe(false)
  })

  it('只配了 FREE 端时 PRO 端不会误用 FREE 的 Key', () => {
    vi.stubEnv('AI_API_KEY_FREE', 'sk-free')
    expect(hasAIKeyForTier('FREE')).toBe(true)
    expect(hasAIKeyForTier('PRO')).toBe(false)
  })

  it('FAMILY 与 PRO 同端', () => {
    vi.stubEnv('AI_API_KEY_PRO', 'sk-pro')
    expect(hasAIKeyForTier('FAMILY')).toBe(true)
    expect(hasAIKeyForTier('PRO')).toBe(true)
  })
})
