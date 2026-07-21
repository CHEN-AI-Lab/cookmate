/**
 * AI 翻译脚本 — 自动补翻译，支持翻译记忆库
 *
 * 主副本路径: /home/ubuntu/workspace/.shared/scripts/translate.mjs
 * 新建项目时复制到 scripts/translate.mjs 即可
 *
 * 用法:
 *   node scripts/translate.mjs <lang-code>                     # 从英文翻译
 *   node scripts/translate.mjs <lang-code> --source <src-lang> # 从指定语言翻译
 *   node scripts/translate.mjs <lang-code> --learn             # 学习 git 变动的翻译
 *
 * 示例:
 *   node scripts/translate.mjs ja           # 英文→日语
 *   node scripts/translate.mjs zh-TW        # 简体中文→繁体中文（自动检测）
 *   node scripts/translate.mjs fr           # 英文→法语
 *   node scripts/translate.mjs zh-TW --learn  # 学习当前翻译文件中有 git 变动的 key
 *
 * 翻译机制:
 * - 中文简体（zh-CN）：直接编写，不是翻译来的
 * - 中文繁体（zh-TW）：从简体中文翻译，不是从英文
 * - 其他语言（ja/fr/de 等）：从英文翻译
 * - 中英文同时编写，互不影响
 */

import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

// ─── 配置 ───
const SHARED_DIR = "/home/ubuntu/workspace/.shared"
const MEMORY_FILE = path.join(SHARED_DIR, "translation-memory.json")
const MESSAGES_DIR = path.resolve("shared/messages")

// ─── 参数解析 ───
const LANG = process.argv[2]
const IS_CHECK = LANG === "--check"
const IS_LEARN = process.argv.includes("--learn")
const SRC_ARG = process.argv.indexOf("--source")
const SRC_LANG = SRC_ARG !== -1 ? process.argv[SRC_ARG + 1] : null

if (!LANG) {
  console.error("用法: node scripts/translate.mjs <lang-code> [--source <src>] [--learn]")
  console.error("       node scripts/translate.mjs --check")
  console.error("示例: node scripts/translate.mjs ja")
  console.error("       node scripts/translate.mjs zh-TW --source zh-CN")
  process.exit(1)
}

// ─── 源语言自动检测 ───
// 中文繁体默认从简体中文翻译，其他语言从英文翻译
const SOURCE_LANG = SRC_LANG || (LANG === "zh-TW" ? "zh-CN" : "en")
const SOURCE_FILE = path.join(MESSAGES_DIR, `${SOURCE_LANG}.json`)
const TARGET_FILE = path.join(MESSAGES_DIR, `${LANG}.json`)

// ===== --check 模式：校验所有语言 key 完全一致 =====
if (IS_CHECK) {
  let allOk = true
  const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json")).sort()
  if (files.length < 2) {
    console.log("✅ 只有一个语言文件，无需校验")
    process.exit(0)
  }
  // 以第一个文件为参考
  const refKey = files[0].replace(".json", "")
  const refFile = path.join(MESSAGES_DIR, files[0])
  const refData = JSON.parse(fs.readFileSync(refFile, "utf-8"))
  const refCount = countKeys(refData)
  const refFlat = new Set(flattenKeys(refData).map((k) => k.keyPath))

  console.log(`📋 参考文件: ${files[0]}（${refCount} key）\n`)

  for (const file of files.slice(1)) {
    const lang = file.replace(".json", "")
    const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), "utf-8"))
    const count = countKeys(data)
    const flat = new Set(flattenKeys(data).map((k) => k.keyPath))

    if (count !== refCount) {
      console.error(`❌ ${file}: ${count} key（参考: ${refCount} key）相差 ${Math.abs(count - refCount)}`)
      allOk = false
    }

    // 对比具体 key 差异
    const missing = [...refFlat].filter((k) => !flat.has(k))
    const extra = [...flat].filter((k) => !refFlat.has(k))
    if (missing.length > 0 || extra.length > 0) {
      allOk = false
      if (count === refCount) console.error(`❌ ${file}: key 数量相同但内容不同`)
      for (const k of missing) console.error(`   缺少: ${k}`)
      for (const k of extra) console.error(`   多余: ${k}`)
    }

    if (count === refCount && missing.length === 0 && extra.length === 0) {
      console.log(`✅ ${file}: ${count} key（一致）`)
    }
  }

  if (allOk) {
    console.log("\n✅ 所有语言文件 key 完全一致")
    process.exit(0)
  } else {
    console.log("\n❌ 存在差异，请修复")
    process.exit(1)
  }
}

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

function getMemoryKey(sourceLang, targetLang) {
  return `${sourceLang}→${targetLang}`
}

function lookupMemory(memory, sourceLang, targetLang, englishText) {
  const mem = memory[getMemoryKey(sourceLang, targetLang)]
  if (!mem) return null
  return mem[englishText] || null
}

function setMemory(memory, sourceLang, targetLang, englishText, translatedText) {
  const key = getMemoryKey(sourceLang, targetLang)
  if (!memory[key]) memory[key] = {}
  if (memory[key][englishText] !== translatedText) {
    memory[key][englishText] = translatedText
    return true
  }
  return false
}

// ─── 主流程 ───

// 读取源文件
const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"))

// 读取目标文件
let target = {}
try {
  target = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8"))
  console.log(`📂 ${LANG}.json（${countKeys(target)} 个 key）`)
} catch {
  console.log(`🆕 新建 ${LANG}.json`)
}

const memory = loadMemory()

// ===== --learn 模式：学习翻译变动（仅学习 git 有变动的 key） =====
if (IS_LEARN) {
  // 获取 git 已提交版本，用于检测哪些 key 发生了变动
  let committedTarget = {}
  let hasGitVersion = false
  try {
    const relativePath = path.relative(process.cwd(), TARGET_FILE)
    const committed = execSync(`git show HEAD:${relativePath}`, { encoding: "utf-8", timeout: 5000 })
    committedTarget = JSON.parse(committed)
    hasGitVersion = true
    console.log(`  📂 对比 git 已提交版本，仅学习有变动的 key`)
  } catch {
    console.log(`  ℹ️  无法获取 git 已提交版本（新文件或未提交），将学习所有 key`)
  }

  // 扁平化已提交版本，便于快速查找
  const committedFlat = {}
  for (const { keyPath, value } of flattenKeys(committedTarget)) {
    committedFlat[keyPath] = value
  }

  // 第一遍：收集所有变动，不修改记忆库
  const changes = []
  const sourceFlat = flattenKeys(source)

  for (const { keyPath, value: srcText } of sourceFlat) {
    const translated = getNested(target, keyPath)
    if (translated === undefined || translated === null) continue

    // 有 git 版本时，只学习有变动的 key
    if (hasGitVersion) {
      const committedValue = committedFlat[keyPath]
      if (committedValue === translated) continue
      changes.push({ keyPath, srcText, translated, oldValue: committedValue ?? "(无)" })
    } else {
      // 无 git 版本：学习所有 key（新文件）
      const memorized = lookupMemory(memory, SOURCE_LANG, LANG, srcText)
      if (memorized !== translated) {
        changes.push({ keyPath, srcText, translated, oldValue: memorized ?? "(无)" })
      }
    }
  }

  if (changes.length === 0) {
    console.log(`\n✅ 无变动可学，记忆库未更新`)
    if (hasGitVersion) {
      console.log(`   （当前文件与 git 已提交版本一致）`)
    }
    process.exit(0)
  }

  // 显示变更摘要
  console.log(`\n📋 以下 ${changes.length} 条翻译将写入记忆库：`)
  for (const { keyPath, srcText, translated, oldValue } of changes) {
    console.log(`  ${keyPath}`)
    console.log(`    源文:       "${srcText}"`)
    console.log(`    旧记忆库:   "${oldValue}"`)
    console.log(`    新值:       "${translated}"`)
  }

  // 确认提示
  const rl = await import("node:readline").then((m) => m.createInterface({
    input: process.stdin,
    output: process.stdout,
  }))

  const answer = await new Promise((resolve) => {
    rl.question(`\n确认学习到记忆库？(y/N) `, (ans) => {
      rl.close()
      resolve(ans.trim().toLowerCase())
    })
  })

  if (answer !== "y" && answer !== "yes") {
    console.log(`\n⏹️  已取消，记忆库未更改`)
    process.exit(0)
  }

  // 第二遍：确认后写入记忆库
  for (const { keyPath, srcText, translated } of changes) {
    setMemory(memory, SOURCE_LANG, LANG, srcText, translated)
  }

  saveMemory(memory)
  console.log(`\n✅ 记忆库已更新 ${changes.length} 条`)
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
findMissing(source, target)

if (missing.length === 0) {
  console.log("✅ 没有缺少的翻译，全部已同步")
  process.exit(0)
}

// 先查记忆库，过滤掉已有记录的
const needAI = []
let memoryHits = 0

for (const item of missing) {
  const memorized = lookupMemory(memory, SOURCE_LANG, LANG, item.text)
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

const LANG_NAME_MAP = {
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
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

const SRC_LANG_NAME = SOURCE_LANG === "en" ? "English" : LANG_NAME_MAP[SOURCE_LANG] || SOURCE_LANG
const TGT_LANG_NAME = LANG_NAME_MAP[LANG] || LANG

for (const [section, items] of Object.entries(groups)) {
  const pairs = items.map((i) => `${i.keyPath}: ${i.text}`).join("\n")
  const systemPrompt = `You are a professional translator. Translate the following translation keys from ${SRC_LANG_NAME} to ${TGT_LANG_NAME}.

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
        setMemory(memory, SOURCE_LANG, LANG, originalItem.text, value)
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