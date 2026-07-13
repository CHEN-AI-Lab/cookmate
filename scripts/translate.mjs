/**
 * AI 翻译脚本 — 自动补翻译，不覆盖已有内容
 *
 * 用法: node scripts/translate.mjs <lang-code>
 * 示例: node scripts/translate.mjs ja     # 翻译日文
 *        node scripts/translate.mjs fr     # 翻译法文
 *
 * 原理:
 * 1. en.json 是源文件（唯一维护的）
 * 2. 对比目标语言文件，只翻译 en 有但目标没有的 key
 * 3. 已有翻译不动
 * 4. next-intl 会回退到 en（没翻译的 key 显示英文，不报错）
 */

import fs from "node:fs"
import path from "node:path"

const LANG = process.argv[2]
if (!LANG) {
  console.error("用法: node scripts/translate.mjs <lang-code>")
  console.error("示例: node scripts/translate.mjs ja")
  process.exit(1)
}

const MESSAGES_DIR = path.resolve("shared/messages")
const SOURCE_FILE = path.join(MESSAGES_DIR, "en.json")
const TARGET_FILE = path.join(MESSAGES_DIR, `${LANG}.json`)

// 读取源文件
const en = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"))

// 读取目标文件（可能不存在）
let target = {}
try {
  target = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8"))
  console.log(`✅ 已存在 ${LANG}.json，${countKeys(target)} 个 key`)
} catch {
  console.log(`🆕 新建 ${LANG}.json`)
}

// 找出缺少的 key
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

console.log(`🔍 发现 ${missing.length} 个缺少的翻译，准备调用 AI...`)

// 按 key 路径设置嵌套值
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

// 调用 AI 翻译
const API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
const API_BASE = process.env.AI_BASE_URL || "https://api.openai.com/v1"
const MODEL = process.env.AI_MODEL || "gpt-4o-mini"

if (!API_KEY) {
  console.error("❌ 需要设置 AI_API_KEY 或 OPENAI_API_KEY 环境变量")
  process.exit(1)
}

// 按 key 前缀分组批量翻译（减少 API 调用次数）
const groups = {}
for (const item of missing) {
  const section = item.keyPath.split(".")[0]
  if (!groups[section]) groups[section] = []
  groups[section].push(item)
}

const LANG_NAME = {
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
    }
  }

  console.log(`  ✅ ${section}: ${items.length} 个已翻译`)
}

// 写回文件
fs.writeFileSync(TARGET_FILE, JSON.stringify(target, null, 2) + "\n")
console.log(`\n✅ 完成！已写入 ${LANG}.json（共 ${countKeys(target)} 个 key）`)

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