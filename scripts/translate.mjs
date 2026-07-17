/**
 * AI 翻译脚本 — 自动补翻译，支持翻译记忆库
 *
 * 用法:
 *   node scripts/translate.mjs <lang-code>          # 翻译缺失的 key
 *   node scripts/translate.mjs <lang-code> --learn   # 学习人工纠正的翻译
 *
 * 示例:
 *   node scripts/translate.mjs ja       # 翻译日文缺失 key
 *   node scripts/translate.mjs ja --learn  # 记住你手动纠正过的日文翻译
 *
 * 原理:
 * 1. en.json 是源文件（唯一维护的）
 * 2. 翻译前先查记忆库 → 有就直接用，没有才调 AI
 * 3. AI 翻译结果自动写入记忆库
 * 4. 记忆库文件: /home/ubuntu/workspace/.shared/translation-memory.json
 * 5. 所有项目共享同一个记忆库
 */

import fs from "node:fs"
import path from "node:path"

// ─── 配置 ───
const SHARED_DIR = "/home/ubuntu/workspace/.shared"
const MEMORY_FILE = path.join(SHARED_DIR, "translation-memory.json")
const MESSAGES_DIR = path.resolve("shared/messages")
const SOURCE_FILE = path.join(MESSAGES_DIR, "en.json")

// ─── 参数解析 ───
const LANG = process.argv[2]
const IS_LEARN = process.argv.includes("--learn")

if (!LANG) {
  console.error("用法: node scripts/translate.mjs <lang-code> [--learn]")
  console.error("示例: node scripts/translate.mjs ja")
  console.error("       node scripts/translate.mjs ja --learn")
  process.exit(1)
}

const TARGET_FILE = path.join(MESSAGES_DIR, `${LANG}.json`)

// ─── 工具函数 ───
function countKeys(obj) {
  let count = 0
  for (const v of Object.values(obj)) {
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      count += countKeys(v)
    } else {
      count++
    }
  }
  return count
}

function setNested(obj, keyPath, value) {
  const keys = keyPath.split(".")
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

function getNested(obj, keyPath) {
  const keys = keyPath.split(".")
  let current = obj
  for (const k of keys) {
    if (current === undefined || current === null || typeof current !== "object") return undefined
    current = current[k]
  }
  return current
}

function flattenKeys(obj, prefix = "") {
  const result = []
  for (const k of Object.keys(obj).sort()) {
    const keyPath = prefix ? `${prefix}.${k}` : k
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
      result.push(...flattenKeys(obj[k], keyPath))
    } else {
      result.push({ keyPath, value: String(obj[k]) })
    }
  }
  return result
}

// ─── 记忆库 ───
function loadMemory() {
  try {
    fs.mkdirSync(SHARED_DIR, { recursive: true })
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"))
  } catch {
    return {}
  }
}

function saveMemory(memory) {
  fs.mkdirSync(SHARED_DIR, { recursive: true })
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2) + "\n")
}

function getMemoryKey(lang) {
  return `en→${lang}`
}

function lookupMemory(memory, lang, englishText) {
  const mem = memory[getMemoryKey(lang)]
  if (!mem) return null
  return mem[englishText] || null
}

function setMemory(memory, lang, englishText, translatedText) {
  const key = getMemoryKey(lang)
  if (!memory[key]) memory[key] = {}
  // 只有翻译不同时才更新，避免写入多余记录
  if (memory[key][englishText] !== translatedText) {
    memory[key][englishText] = translatedText
    return true
  }
  return false
}

// ─── 主流程 ───

// 读取源文件
const en = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"))

// 读取目标文件
let target = {}
try {
  target = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8"))
  console.log(`📂 ${LANG}.json（${countKeys(target)} 个 key）`)
} catch {
  console.log(`🆕 新建 ${LANG}.json`)
}

const memory = loadMemory()

// ===== --learn 模式：扫描人工纠正的翻译，更新记忆库 =====
if (IS_LEARN) {
  const enFlat = flattenKeys(en)
  let updated = 0

  for (const { keyPath, value: enText } of enFlat) {
    const translated = getNested(target, keyPath)
    if (translated === undefined || translated === null) continue

    const memorized = lookupMemory(memory, LANG, enText)
    if (memorized !== translated) {
      if (setMemory(memory, LANG, enText, translated)) {
        console.log(`  📝 ${keyPath}: "${memorized || "(无)"}" → "${translated}"`)
        updated++
      }
    }
  }

  saveMemory(memory)
  console.log(`\n✅ 记忆库已更新 ${updated} 条`)
  if (updated > 0) {
    console.log(`   位置: ${MEMORY_FILE}`)
  }
  process.exit(0)
}

// ===== 翻译模式：找出缺失的 key =====
const missing = []
function findMissing(src, tgt, prefix = "") {
  for (const k of Object.keys(src)) {
    const keyPath = prefix ? `${prefix}.${k}` : k
    if (typeof src[k] === "object" && src[k] !== null && !Array.isArray(src[k])) {
      if (!tgt[k] || typeof tgt[k] !== "object") tgt[k] = {}
      findMissing(src[k], tgt[k], keyPath)
    } else if (tgt[k] === undefined) {
      missing.push({ keyPath, text: String(src[k]) })
    }
  }
}
findMissing(en, target)

if (missing.length === 0) {
  console.log("✅ 没有缺少的翻译，全部已同步")
  process.exit(0)
}

// 先查记忆库，过滤掉已有记录的
const needAI = []
let memoryHits = 0

for (const item of missing) {
  const memorized = lookupMemory(memory, LANG, item.text)
  if (memorized !== null) {
    setNested(target, item.keyPath, memorized)
    memoryHits++
  } else {
    needAI.push(item)
  }
}

if (memoryHits > 0) {
  console.log(`💾 记忆库命中 ${memoryHits} 条，跳过 AI 调用`)
}

if (needAI.length === 0) {
  fs.writeFileSync(TARGET_FILE, JSON.stringify(target, null, 2) + "\n")
  console.log(`\n✅ 完成！全部来自记忆库，已写入 ${LANG}.json（共 ${countKeys(target)} 个 key）`)
  process.exit(0)
}

console.log(`🔍 还需 AI 翻译 ${needAI.length} 条，准备调用...`)

// ─── AI 翻译 ───
const API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
const API_BASE = process.env.AI_BASE_URL || "https://api.openai.com/v1"
const MODEL = process.env.AI_MODEL || "gpt-4o-mini"

if (!API_KEY) {
  console.error("❌ 需要设置 AI_API_KEY 或 OPENAI_API_KEY 环境变量")
  process.exit(1)
}

// 按 key 前缀分组批量翻译
const groups = {}
for (const item of needAI) {
  const section = item.keyPath.split(".")[0]
  if (!groups[section]) groups[section] = []
  groups[section].push(item)
}

const LANG_NAME = {
  "zh-CN": "Chinese (Simplified)",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
  ar: "Arabic",
  vi: "Vietnamese",
  th: "Thai",
}[LANG] || LANG

for (const [section, items] of Object.entries(groups)) {
  const pairs = items.map((i) => `${i.keyPath}: ${i.text}`).join("\n")
  const systemPrompt = `You are a professional translator. Translate the following translation keys from English to ${LANG_NAME}.

Rules:
- Keep the key names (the part before the colon) unchanged
- Only translate the value (the part after the colon)
- Preserve any {placeholder} variables exactly as-is (e.g. {name}, {count}, {title})
- Preserve HTML tags if present
- Return the translations in the exact same format: key: translated_value
- Do NOT translate pricing numbers, currency symbols, or technical terms like URLs`

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pairs },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`❌ AI 调用失败 (${section}): ${err.substring(0, 200)}`)
    continue
  }

  const data = await response.json()
  const result = data.choices?.[0]?.message?.content || ""
  const lines = result.split("\n").filter(Boolean)

  for (const line of lines) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.substring(0, colonIdx).trim()
    const value = line.substring(colonIdx + 1).trim()
    if (key && value) {
      setNested(target, key, value)
      // 同时写入记忆库
      const originalItem = items.find((i) => i.keyPath === key)
      if (originalItem) {
        setMemory(memory, LANG, originalItem.text, value)
      }
    }
  }

  console.log(`  ✅ ${section}: ${items.length} 个已翻译`)
}

// 保存记忆库
saveMemory(memory)

// 写回翻译文件
fs.writeFileSync(TARGET_FILE, JSON.stringify(target, null, 2) + "\n")
console.log(`\n✅ 完成！已写入 ${LANG}.json（共 ${countKeys(target)} 个 key）`)
console.log(`💾 记忆库已更新: ${MEMORY_FILE}`)