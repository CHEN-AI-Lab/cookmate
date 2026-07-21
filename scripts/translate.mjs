/**
 * AI 翻译脚本 — 自动补翻译，支持翻译记忆库（锁定/解锁/备份/统计/搜索/导出/导入）
 *
 * 主副本路径: /home/ubuntu/workspace/.shared/scripts/translate.mjs
 * 新建项目时复制到 scripts/translate.mjs 即可
 *
 * 用法:
 *   node scripts/translate.mjs <lang-code>                     # 从英文翻译
 *   node scripts/translate.mjs <lang-code> --source <src-lang> # 从指定语言翻译
 *   node scripts/translate.mjs <lang-code> --learn             # 学习 git 变动的翻译
 *   node scripts/translate.mjs --lock                          # 交互式锁定条目
 *   node scripts/translate.mjs --unlock                        # 交互式解锁条目
 *   node scripts/translate.mjs --show-locks                    # 显示所有已锁定条目
 *   node scripts/translate.mjs --restore                       # 从备份恢复记忆库
 *   node scripts/translate.mjs --stats                         # 显示记忆库统计
 *   node scripts/translate.mjs --search <text>                 # 搜索记忆库
 *   node scripts/translate.mjs --export <file>                 # 导出记忆库
 *   node scripts/translate.mjs --import <file>                 # 导入/合并记忆库
 *   node scripts/translate.mjs --check                         # 校验所有语言 key 一致
 *
 * 示例:
 *   node scripts/translate.mjs ja                    # 英文→日语
 *   node scripts/translate.mjs zh-TW                 # 简体中文→繁体中文（自动检测）
 *   node scripts/translate.mjs fr                    # 英文→法语
 *   node scripts/translate.mjs zh-TW --learn         # 学习当前翻译文件中有 git 变动的 key
 *   node scripts/translate.mjs --lock                # 锁定已确认的翻译
 *   node scripts/translate.mjs --unlock              # 解锁条目
 *   node scripts/translate.mjs --show-locks          # 查看已锁定条目
 *   node scripts/translate.mjs --restore             # 从备份恢复
 *   node scripts/translate.mjs --stats               # 查看统计
 *   node scripts/translate.mjs --search egg          # 搜索 "egg" 相关翻译
 *   node scripts/translate.mjs --export ~/backup.json # 导出到文件
 *   node scripts/translate.mjs --import ~/team.json  # 导入合并
 *
 * 记忆库格式:
 *   {
 *     "en→ja": {
 *       "locked":   { "egg": "卵", "salt": "塩" },   ← --learn 不碰
 *       "unlocked": { "sugar": "砂糖" }               ← --learn 正常覆盖
 *     }
 *   }
 *
 * 备份文件:
 *   translation-memory.json.bak     ← 最新备份（用于 --restore）
 *   translation-memory.json.bak.1   ← 最近 1 次备份
 *   ...                             ← 最多保留 5 份
 *   translation-memory.json.bak.5   ← 最近 5 次备份
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
const BACKUP_FILE = path.join(SHARED_DIR, "translation-memory.json.bak")
const MAX_BACKUPS = 5

// ─── 参数解析 ───
const LANG = process.argv[2]
const IS_CHECK = process.argv.includes("--check")
const IS_LEARN = process.argv.includes("--learn")
const IS_LOCK = process.argv.includes("--lock") && !process.argv.includes("--unlock")
const IS_UNLOCK = process.argv.includes("--unlock")
const IS_SHOW_LOCKS = process.argv.includes("--show-locks")
const IS_RESTORE = process.argv.includes("--restore")
const IS_STATS = process.argv.includes("--stats")

const SEARCH_INDEX = process.argv.indexOf("--search")
const IS_SEARCH = SEARCH_INDEX !== -1
const SEARCH_TERM = IS_SEARCH ? (process.argv[SEARCH_INDEX + 1] || null) : null

const EXPORT_INDEX = process.argv.indexOf("--export")
const IS_EXPORT = EXPORT_INDEX !== -1
const EXPORT_PATH = IS_EXPORT ? (process.argv[EXPORT_INDEX + 1] || null) : null

const IMPORT_INDEX = process.argv.indexOf("--import")
const IS_IMPORT = IMPORT_INDEX !== -1
const IMPORT_PATH = IS_IMPORT ? (process.argv[IMPORT_INDEX + 1] || null) : null

const SRC_ARG = process.argv.indexOf("--source")
const SRC_LANG = SRC_ARG !== -1 ? process.argv[SRC_ARG + 1] : null

// 检查是否独立模式（不需要 <lang-code>）
const IS_STANDALONE = IS_CHECK || IS_LOCK || IS_UNLOCK || IS_SHOW_LOCKS || IS_RESTORE || IS_STATS || IS_SEARCH || IS_EXPORT || IS_IMPORT

if (!LANG && !IS_STANDALONE) {
  console.error("用法: node scripts/translate.mjs <lang-code> [--source <src>] [--learn]")
  console.error("       node scripts/translate.mjs --check")
  console.error("       node scripts/translate.mjs --lock")
  console.error("       node scripts/translate.mjs --unlock")
  console.error("       node scripts/translate.mjs --show-locks")
  console.error("       node scripts/translate.mjs --restore")
  console.error("       node scripts/translate.mjs --stats")
  console.error("       node scripts/translate.mjs --search <text>")
  console.error("       node scripts/translate.mjs --export <file>")
  console.error("       node scripts/translate.mjs --import <file>")
  console.error("示例: node scripts/translate.mjs ja")
  console.error("       node scripts/translate.mjs zh-TW --source zh-CN")
  process.exit(1)
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

/**
 * 归一化源文本：trim + 小写，确保匹配不受空格/大小写影响
 */
function normalizeSource(text) {
  return String(text).trim().toLowerCase()
}

// 记录加载时的文件修改时间，用于并发检测
let memoryLoadedMtime = null

// ─── 记忆库 ───
function loadMemory() {
  try {
    fs.mkdirSync(SHARED_DIR, { recursive: true })

    if (!fs.existsSync(MEMORY_FILE)) {
      return {}
    }

    // 记录加载时的 mtime，用于并发检测
    try {
      memoryLoadedMtime = fs.statSync(MEMORY_FILE).mtimeMs
    } catch {
      memoryLoadedMtime = null
    }

    const raw = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"))
    return migrateMemory(raw)
  } catch (e) {
    console.error(`\n❌ 记忆库文件损坏或无法读取: ${MEMORY_FILE}`)
    console.error(`   错误: ${e.message}`)
    console.error(`\n💡 尝试用以下命令从备份恢复:`)
    console.error(`   node scripts/translate.mjs --restore\n`)
    process.exit(1)
  }
}

/**
 * 迁移旧格式 + 归一化所有 key
 */
function migrateMemory(memory) {
  let migrated = false
  let normalized = false

  for (const [langKey, entries] of Object.entries(memory)) {
    if (typeof entries !== "object" || entries === null) continue

    if (entries.locked === undefined && entries.unlocked === undefined) {
      memory[langKey] = { locked: {}, unlocked: { ...entries } }
      migrated = true
    }

    const langGroup = memory[langKey]
    for (const groupName of ["locked", "unlocked"]) {
      const group = langGroup[groupName]
      if (!group || typeof group !== "object") continue
      const keys = Object.keys(group)
      for (const rawKey of keys) {
        const normalized = normalizeSource(rawKey)
        if (normalized !== rawKey) {
          group[normalized] = group[rawKey]
          delete group[rawKey]
          normalized = true
        }
      }
    }
  }

  if (migrated || normalized) {
    saveMemory(memory, true)
    const msgs = []
    if (migrated) msgs.push("旧格式 → locked/unlocked 分组")
    if (normalized) msgs.push("key 已归一化（trim + lowercase）")
    console.log(`  🔄 记忆库格式已自动迁移（${msgs.join("，")}）`)
  }
  return memory
}

/**
 * 带版本轮转的备份
 */
function rotateBackups() {
  if (!fs.existsSync(MEMORY_FILE)) return

  for (let i = MAX_BACKUPS; i >= 2; i--) {
    const oldName = path.join(SHARED_DIR, `translation-memory.json.bak.${i - 1}`)
    const newName = path.join(SHARED_DIR, `translation-memory.json.bak.${i}`)
    if (fs.existsSync(oldName)) {
      fs.renameSync(oldName, newName)
    }
  }

  fs.copyFileSync(MEMORY_FILE, path.join(SHARED_DIR, "translation-memory.json.bak.1"))
  fs.copyFileSync(MEMORY_FILE, BACKUP_FILE)
}

/**
 * 检查是否有并发写入
 */
function checkConcurrentModification() {
  if (memoryLoadedMtime === null) return true

  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const currentMtime = fs.statSync(MEMORY_FILE).mtimeMs
      if (currentMtime > memoryLoadedMtime) {
        console.error("  ⚠️  警告：记忆库在加载后被外部修改！")
        console.error("     本次写入可能覆盖他人的变更")
        console.error("     建议先退出，用 --restore 检查或手动合并")
        return false
      }
    }
  } catch {
    // 忽略 stat 错误
  }
  return true
}

function saveMemory(memory, silent = false) {
  fs.mkdirSync(SHARED_DIR, { recursive: true })

  checkConcurrentModification()

  try {
    rotateBackups()
  } catch (e) {
    if (!silent) console.error(`  ⚠️  备份失败: ${e.message}`)
  }

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2) + "\n")
}

function getMemoryKey(sourceLang, targetLang) {
  return `${sourceLang}→${targetLang}`
}

function lookupMemory(memory, sourceLang, targetLang, sourceText) {
  const langGroup = memory[getMemoryKey(sourceLang, targetLang)]
  if (!langGroup) return null
  const key = normalizeSource(sourceText)

  if (langGroup.locked && langGroup.locked[key] !== undefined) {
    return langGroup.locked[key]
  }
  if (langGroup.unlocked && langGroup.unlocked[key] !== undefined) {
    return langGroup.unlocked[key]
  }
  return null
}

function setMemory(memory, sourceLang, targetLang, sourceText, translatedText) {
  const key = getMemoryKey(sourceLang, targetLang)
  if (!memory[key]) memory[key] = { locked: {}, unlocked: {} }

  const normalizedKey = normalizeSource(sourceText)

  if (memory[key].locked && memory[key].locked[normalizedKey] !== undefined) {
    return false
  }

  if (!memory[key].unlocked) memory[key].unlocked = {}
  if (memory[key].unlocked[normalizedKey] !== translatedText) {
    memory[key].unlocked[normalizedKey] = translatedText
    return true
  }
  return false
}

function isLocked(memory, sourceLang, targetLang, sourceText) {
  const langGroup = memory[getMemoryKey(sourceLang, targetLang)]
  if (!langGroup) return false
  const key = normalizeSource(sourceText)
  return langGroup.locked && langGroup.locked[key] !== undefined
}

/**
 * 验证 JSON 文件内容是否有效
 */
function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    JSON.parse(content)
    return true
  } catch (e) {
    return false
  }
}

// ===== --check 模式：校验所有语言 key 完全一致 =====
if (IS_CHECK) {
  let allOk = true
  const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json")).sort()
  if (files.length < 2) {
    console.log("✅ 只有一个语言文件，无需校验")
    process.exit(0)
  }
  const refFile = path.join(MESSAGES_DIR, files[0])
  const refData = JSON.parse(fs.readFileSync(refFile, "utf-8"))
  const refCount = countKeys(refData)
  const refFlat = new Set(flattenKeys(refData).map((k) => k.keyPath))

  console.log(`📋 参考文件: ${files[0]}（${refCount} key）\n`)

  for (const file of files.slice(1)) {
    const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), "utf-8"))
    const count = countKeys(data)
    const flat = new Set(flattenKeys(data).map((k) => k.keyPath))

    if (count !== refCount) {
      console.error(`❌ ${file}: ${count} key（参考: ${refCount} key）相差 ${Math.abs(count - refCount)}`)
      allOk = false
    }

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

// ===== --lock 模式：交互式锁定条目 =====
if (IS_LOCK) {
  const memory = loadMemory()
  let hasAny = false

  for (const [langKey, langGroup] of Object.entries(memory)) {
    const unlocked = langGroup.unlocked || {}
    const entries = Object.entries(unlocked)
    if (entries.length === 0) continue

    hasAny = true
    console.log(`\n📂 ${langKey}（可锁定 ${entries.length} 条）：`)
    entries.forEach(([srcText, translation], i) => {
      console.log(`  [${i + 1}] "${srcText}" → "${translation}"`)
    })
  }

  if (!hasAny) {
    console.log("📭 没有可锁定的条目（所有条目已锁定或记忆库为空）")
    process.exit(0)
  }

  const rl = await import("node:readline").then((m) => m.createInterface({
    input: process.stdin,
    output: process.stdout,
  }))

  const answer = await new Promise((resolve) => {
    rl.question("\n输入要锁定的序号（逗号分隔，或 all 锁定全部，直接回车取消）: ", (ans) => {
      rl.close()
      resolve(ans.trim())
    })
  })

  if (!answer) {
    console.log("\n⏹️  已取消，记忆库未更改")
    process.exit(0)
  }

  let lockedCount = 0
  const indices = answer === "all" ? null : answer.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))

  for (const [langKey, langGroup] of Object.entries(memory)) {
    const unlocked = langGroup.unlocked || {}
    const entries = Object.entries(unlocked)

    for (let i = 0; i < entries.length; i++) {
      const [srcText, translation] = entries[i]
      if (indices === null || indices.includes(i + 1)) {
        if (!langGroup.locked) langGroup.locked = {}
        langGroup.locked[srcText] = translation
        delete langGroup.unlocked[srcText]
        console.log(`  🔒 ${langKey}: "${srcText}" → "${translation}"`)
        lockedCount++
      }
    }

    if (langGroup.unlocked && Object.keys(langGroup.unlocked).length === 0) {
      delete langGroup.unlocked
    }
  }

  saveMemory(memory)
  console.log(`\n✅ 已锁定 ${lockedCount} 条`)
  process.exit(0)
}

// ===== --unlock 模式：交互式解锁条目 =====
if (IS_UNLOCK) {
  const memory = loadMemory()
  let hasAny = false

  for (const [langKey, langGroup] of Object.entries(memory)) {
    const locked = langGroup.locked || {}
    const entries = Object.entries(locked)
    if (entries.length === 0) continue

    hasAny = true
    console.log(`\n📂 ${langKey}（已锁定 ${entries.length} 条）：`)
    entries.forEach(([srcText, translation], i) => {
      console.log(`  [${i + 1}] "${srcText}" → "${translation}"`)
    })
  }

  if (!hasAny) {
    console.log("📭 没有已锁定的条目")
    process.exit(0)
  }

  const rl = await import("node:readline").then((m) => m.createInterface({
    input: process.stdin,
    output: process.stdout,
  }))

  const answer = await new Promise((resolve) => {
    rl.question("\n输入要解锁的序号（逗号分隔，或 all 解锁全部，直接回车取消）: ", (ans) => {
      rl.close()
      resolve(ans.trim())
    })
  })

  if (!answer) {
    console.log("\n⏹️  已取消，记忆库未更改")
    process.exit(0)
  }

  let unlockedCount = 0
  const indices = answer === "all" ? null : answer.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))

  for (const [langKey, langGroup] of Object.entries(memory)) {
    const locked = langGroup.locked || {}
    const entries = Object.entries(locked)

    for (let i = 0; i < entries.length; i++) {
      const [srcText, translation] = entries[i]
      if (indices === null || indices.includes(i + 1)) {
        if (!langGroup.unlocked) langGroup.unlocked = {}
        langGroup.unlocked[srcText] = translation
        delete langGroup.locked[srcText]
        console.log(`  🔓 ${langKey}: "${srcText}" → "${translation}"`)
        unlockedCount++
      }
    }

    if (langGroup.locked && Object.keys(langGroup.locked).length === 0) {
      delete langGroup.locked
    }
  }

  saveMemory(memory)
  console.log(`\n✅ 已解锁 ${unlockedCount} 条`)
  process.exit(0)
}

// ===== --show-locks 模式：显示所有已锁定条目 =====
if (IS_SHOW_LOCKS) {
  const memory = loadMemory()
  let hasAny = false

  for (const [langKey, langGroup] of Object.entries(memory)) {
    const locked = langGroup.locked || {}
    const entries = Object.entries(locked)
    if (entries.length === 0) continue

    hasAny = true
    console.log(`\n🔒 ${langKey}（${entries.length} 条）：`)
    for (const [srcText, translation] of entries) {
      console.log(`  "${srcText}" → "${translation}"`)
    }
  }

  if (!hasAny) {
    console.log("📭 没有已锁定的条目")
  }
  process.exit(0)
}

// ===== --restore 模式：从备份恢复记忆库（带验证） =====
if (IS_RESTORE) {
  console.log("📋 可用备份：")
  const backups = []
  if (fs.existsSync(BACKUP_FILE)) {
    const stat = fs.statSync(BACKUP_FILE)
    const size = (stat.size / 1024).toFixed(1)
    const valid = validateJsonFile(BACKUP_FILE)
    backups.push({ file: BACKUP_FILE, label: "最新 (latest)", size, valid })
    console.log(`  [1] 最新备份 (${size} KB)${valid ? "" : " ⚠️ 损坏"}`)
  }
  for (let i = 1; i <= MAX_BACKUPS; i++) {
    const bakPath = path.join(SHARED_DIR, `translation-memory.json.bak.${i}`)
    if (fs.existsSync(bakPath)) {
      const stat = fs.statSync(bakPath)
      const size = (stat.size / 1024).toFixed(1)
      const valid = validateJsonFile(bakPath)
      backups.push({ file: bakPath, label: `备份 #${i}`, size, valid })
      console.log(`  [${backups.length}] 备份 #${i} (${size} KB)${valid ? "" : " ⚠️ 损坏"}`)
    }
  }

  if (backups.length === 0) {
    console.error("❌ 没有找到任何备份文件")
    process.exit(1)
  }

  const validBackups = backups.filter((b) => b.valid)
  if (validBackups.length === 0) {
    console.error("\n❌ 所有备份文件都已损坏，无法恢复")
    console.error("   记忆库文件本身可能还可用，请检查:")
    console.error(`   ${MEMORY_FILE}`)
    process.exit(1)
  }

  const rl = await import("node:readline").then((m) => m.createInterface({
    input: process.stdin,
    output: process.stdout,
  }))

  const answer = await new Promise((resolve) => {
    rl.question(`\n选择要恢复的备份编号（默认 1，或输入版本号如 .bak.3，回车取消）: `, (ans) => {
      rl.close()
      resolve(ans.trim())
    })
  })

  if (!answer) {
    console.log("\n⏹️  已取消")
    process.exit(0)
  }

  let restoreFile = BACKUP_FILE

  if (answer.startsWith(".bak") || answer.startsWith("bak")) {
    const verPath = answer.startsWith(".") ? path.join(SHARED_DIR, `translation-memory${answer}`) : path.join(SHARED_DIR, `translation-memory.${answer}`)
    if (fs.existsSync(verPath)) {
      if (!validateJsonFile(verPath)) {
        console.error(`❌ 备份文件 ${verPath} 已损坏，无法恢复`)
        process.exit(1)
      }
      restoreFile = verPath
    } else {
      console.error(`❌ 未找到备份: ${verPath}`)
      process.exit(1)
    }
  } else {
    const idx = parseInt(answer)
    if (!isNaN(idx) && idx >= 1 && idx <= backups.length) {
      if (!backups[idx - 1].valid) {
        console.error(`❌ 备份 #${idx} 已损坏，无法恢复`)
        process.exit(1)
      }
      restoreFile = backups[idx - 1].file
    } else {
      console.error("❌ 无效的备份编号")
      process.exit(1)
    }
  }

  const rl2 = await import("node:readline").then((m) => m.createInterface({
    input: process.stdin,
    output: process.stdout,
  }))

  const confirm = await new Promise((resolve) => {
    rl2.question(`\n⚠️  确认从以下文件恢复？当前记忆库将被覆盖\n   来源: ${restoreFile}\n   (y/N) `, (ans) => {
      rl2.close()
      resolve(ans.trim().toLowerCase())
    })
  })

  if (confirm !== "y" && confirm !== "yes") {
    console.log("\n⏹️  已取消")
    process.exit(0)
  }

  try {
    if (fs.existsSync(MEMORY_FILE)) {
      rotateBackups()
    }
  } catch {
    // 忽略
  }

  fs.copyFileSync(restoreFile, MEMORY_FILE)
  console.log("\n✅ 已从备份恢复记忆库")
  console.log(`   来源: ${restoreFile}`)
  process.exit(0)
}

// ===== --stats 模式：显示记忆库统计（含一致性检查） =====
if (IS_STATS) {
  const memory = loadMemory()
  let totalEntries = 0
  let totalLocked = 0
  let totalUnlocked = 0
  let langCount = 0
  const inconsistencies = []

  console.log("\n📊 记忆库统计：")
  console.log(`   ${"=".repeat(50)}`)

  for (const [langKey, langGroup] of Object.entries(memory)) {
    if (typeof langGroup !== "object" || langGroup === null) continue
    const locked = langGroup.locked ? Object.keys(langGroup.locked).length : 0
    const unlocked = langGroup.unlocked ? Object.keys(langGroup.unlocked).length : 0
    const total = locked + unlocked
    if (total === 0) continue

    langCount++
    totalEntries += total
    totalLocked += locked
    totalUnlocked += unlocked

    const lockedPct = total > 0 ? ((locked / total) * 100).toFixed(0) : "0"
    console.log(`   📂 ${langKey}:`)
    console.log(`      总计: ${total} 条`)
    console.log(`      🔒 已锁定: ${locked} (${lockedPct}%)`)
    console.log(`      🔓 未锁定: ${unlocked}`)

    // 一致性检查：同一条源文本在 locked 和 unlocked 中是否有不同翻译
    if (locked > 0 && unlocked > 0) {
      for (const [srcText, lockedVal] of Object.entries(langGroup.locked || {})) {
        const normalizedKey = normalizeSource(srcText)
        const unlockedVal = langGroup.unlocked ? langGroup.unlocked[normalizedKey] : undefined
        if (unlockedVal !== undefined && unlockedVal !== lockedVal) {
          inconsistencies.push({
            langKey,
            srcText,
            lockedVal,
            unlockedVal,
          })
        }
      }
    }
  }

  if (langCount === 0) {
    console.log("   📭 记忆库为空")
  }

  console.log(`   ${"=".repeat(50)}`)
  if (langCount > 0) {
    const lockedPct = ((totalLocked / totalEntries) * 100).toFixed(0)
    console.log(`   合计: ${totalEntries} 条 (${langCount} 个语言对)`)
    console.log(`   🔒 已锁定: ${totalLocked} (${lockedPct}%)`)
    console.log(`   🔓 未锁定: ${totalUnlocked}`)
  }

  // 一致性检查输出
  if (inconsistencies.length > 0) {
    console.log(`\n⚠️  发现 ${inconsistencies.length} 条不一致（locked 和 unlocked 中翻译不同）：`)
    for (const inc of inconsistencies) {
      console.log(`   ${inc.langKey}: "${inc.srcText}"`)
      console.log(`     locked:   "${inc.lockedVal}"`)
      console.log(`     unlocked: "${inc.unlockedVal}"`)
    }
  } else if (langCount > 0) {
    console.log(`\n✅ 一致性检查通过`)
  }

  // 备份文件信息
  const bakFiles = []
  for (let i = 0; i <= MAX_BACKUPS; i++) {
    const bakPath = i === 0 ? BACKUP_FILE : path.join(SHARED_DIR, `translation-memory.json.bak.${i}`)
    if (fs.existsSync(bakPath)) {
      const stat = fs.statSync(bakPath)
      bakFiles.push({ name: path.basename(bakPath), size: `${(stat.size / 1024).toFixed(1)} KB`, mtime: stat.mtime.toISOString().slice(0, 19).replace("T", " ") })
    }
  }

  if (bakFiles.length > 0) {
    console.log(`\n📦 备份文件 (${bakFiles.length} 份):`)
    for (const f of bakFiles) {
      console.log(`   ${f.name.padEnd(35)} ${f.size.padEnd(8)} ${f.mtime}`)
    }
  }

  process.exit(0)
}

// ===== --search 模式：搜索记忆库 =====
if (IS_SEARCH) {
  const memory = loadMemory()
  let searchTerm = SEARCH_TERM

  // 如果没有提供搜索词，交互式输入
  if (!searchTerm) {
    const rl = await import("node:readline").then((m) => m.createInterface({
      input: process.stdin,
      output: process.stdout,
    }))
    searchTerm = await new Promise((resolve) => {
      rl.question("🔍 输入搜索关键词: ", (ans) => {
        rl.close()
        resolve(ans.trim())
      })
    })
  }

  if (!searchTerm) {
    console.log("⏹️  已取消")
    process.exit(0)
  }

  const term = searchTerm.toLowerCase()
  let resultCount = 0

  console.log(`\n🔍 搜索 "${searchTerm}" 的记忆库匹配：`)
  console.log(`   ${"=".repeat(50)}`)

  for (const [langKey, langGroup] of Object.entries(memory)) {
    if (typeof langGroup !== "object" || langGroup === null) continue

    for (const groupName of ["locked", "unlocked"]) {
      const group = langGroup[groupName]
      if (!group || typeof group !== "object") continue

      for (const [srcText, translation] of Object.entries(group)) {
        if (srcText.toLowerCase().includes(term) || translation.toLowerCase().includes(term)) {
          resultCount++
          const lockIcon = groupName === "locked" ? "🔒" : "🔓"
          console.log(`   ${lockIcon} ${langKey}: "${srcText}" → "${translation}"`)
        }
      }
    }
  }

  if (resultCount === 0) {
    console.log("   📭 未找到匹配结果")
  } else {
    console.log(`   ${"=".repeat(50)}`)
    console.log(`   找到 ${resultCount} 条匹配`)
  }

  process.exit(0)
}

// ===== --export 模式：导出记忆库 =====
if (IS_EXPORT) {
  if (!EXPORT_PATH) {
    console.error("❌ 请指定导出路径")
    console.error("   用法: node scripts/translate.mjs --export <filepath>")
    console.error("   示例: node scripts/translate.mjs --export ~/backup.json")
    process.exit(1)
  }

  if (!fs.existsSync(MEMORY_FILE)) {
    console.error("❌ 记忆库文件不存在，无法导出")
    process.exit(1)
  }

  const destPath = path.resolve(EXPORT_PATH)
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.copyFileSync(MEMORY_FILE, destPath)

  const stat = fs.statSync(MEMORY_FILE)
  console.log(`\n✅ 记忆库已导出`)
  console.log(`   来源: ${MEMORY_FILE}`)
  console.log(`   目标: ${destPath}`)
  console.log(`   大小: ${(stat.size / 1024).toFixed(1)} KB`)
  process.exit(0)
}

// ===== --import 模式：导入/合并记忆库 =====
if (IS_IMPORT) {
  if (!IMPORT_PATH) {
    console.error("❌ 请指定导入文件路径")
    console.error("   用法: node scripts/translate.mjs --import <filepath>")
    console.error("   示例: node scripts/translate.mjs --import ~/team-memory.json")
    process.exit(1)
  }

  const importFile = path.resolve(IMPORT_PATH)
  if (!fs.existsSync(importFile)) {
    console.error(`❌ 文件不存在: ${importFile}`)
    process.exit(1)
  }

  // 验证导入文件是否有效 JSON
  if (!validateJsonFile(importFile)) {
    console.error(`❌ 导入文件不是有效的 JSON 格式: ${importFile}`)
    process.exit(1)
  }

  const imported = JSON.parse(fs.readFileSync(importFile, "utf-8"))
  const current = loadMemory()

  let added = 0
  let skipped = 0
  let conflicts = 0

  console.log(`\n📍 导入记忆库: ${IMPORT_PATH}`)

  for (const [langKey, langGroup] of Object.entries(imported)) {
    if (typeof langGroup !== "object" || langGroup === null) continue

    // 处理旧格式和 new 格式
    let importLocked = {}
    let importUnlocked = {}
    if (langGroup.locked !== undefined || langGroup.unlocked !== undefined) {
      importLocked = langGroup.locked || {}
      importUnlocked = langGroup.unlocked || {}
    } else {
      // 旧格式：全部作为 unlocked
      importUnlocked = { ...langGroup }
    }

    // 确保当前语言组存在
    if (!current[langKey]) current[langKey] = { locked: {}, unlocked: {} }

    for (const groupName of ["locked", "unlocked"]) {
      const importGroup = groupName === "locked" ? importLocked : importUnlocked
      const currentGroup = groupName === "locked" ? current[langKey].locked : current[langKey].unlocked

      for (const [srcText, translation] of Object.entries(importGroup)) {
        const normalizedKey = normalizeSource(srcText)

        // 检查当前记忆库是否已有此条目
        const currentLocked = current[langKey].locked ? current[langKey].locked[normalizedKey] : undefined
        const currentUnlocked = current[langKey].unlocked ? current[langKey].unlocked[normalizedKey] : undefined

        if (currentLocked !== undefined || currentUnlocked !== undefined) {
          // 已有内容，检查是否一致
          const currentValue = currentLocked ?? currentUnlocked
          if (currentValue !== translation) {
            conflicts++
            console.log(`  ⚠️  冲突 ${langKey}: "${srcText}"`)
            console.log(`     当前: "${currentValue}"`)
            console.log(`     导入: "${translation}"`)
            console.log(`     保留当前值，未覆盖`)
          } else {
            skipped++
          }
        } else {
          // 新增条目
          currentGroup[normalizedKey] = translation
          added++
        }
      }
    }
  }

  saveMemory(current)

  console.log(`\n✅ 导入完成`)
  console.log(`   ✅ 新增: ${added}`)
  console.log(`   ⏭️  跳过(已存在): ${skipped}`)
  if (conflicts > 0) console.log(`   ⚠️  冲突(保留当前值): ${conflicts}`)
  process.exit(0)
}

// ===== 以下为需要 <lang-code> 的模式 =====
// ─── 源语言自动检测 ───
const SOURCE_LANG = SRC_LANG || (LANG === "zh-TW" ? "zh-CN" : "en")
const SOURCE_FILE = path.join(MESSAGES_DIR, `${SOURCE_LANG}.json`)
const TARGET_FILE = path.join(MESSAGES_DIR, `${LANG}.json`)

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"))

let target = {}
try {
  target = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8"))
  console.log(`📂 ${LANG}.json（${countKeys(target)} 个 key）`)
} catch {
  console.log(`🆕 新建 ${LANG}.json`)
}

const memory = loadMemory()

// ===== --learn 模式：学习翻译变动（跳过已锁定的条目） =====
if (IS_LEARN) {
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

  const committedFlat = {}
  for (const { keyPath, value } of flattenKeys(committedTarget)) {
    committedFlat[keyPath] = value
  }

  const changes = []
  const sourceFlat = flattenKeys(source)
  let skippedLocked = 0

  for (const { keyPath, value: srcText } of sourceFlat) {
    const translated = getNested(target, keyPath)
    if (translated === undefined || translated === null) continue

    if (isLocked(memory, SOURCE_LANG, LANG, srcText)) {
      skippedLocked++
      continue
    }

    if (hasGitVersion) {
      const committedValue = committedFlat[keyPath]
      if (committedValue === translated) continue
      changes.push({ keyPath, srcText, translated, oldValue: committedValue ?? "(无)" })
    } else {
      const memorized = lookupMemory(memory, SOURCE_LANG, LANG, srcText)
      if (memorized !== translated) {
        changes.push({ keyPath, srcText, translated, oldValue: memorized ?? "(无)" })
      }
    }
  }

  if (skippedLocked > 0) {
    console.log(`  🔒 跳过 ${skippedLocked} 条已锁定的条目`)
  }

  if (changes.length === 0) {
    console.log(`\n✅ 无变动可学，记忆库未更新`)
    if (hasGitVersion) {
      console.log(`   （当前文件与 git 已提交版本一致）`)
    }
    process.exit(0)
  }

  console.log(`\n📋 以下 ${changes.length} 条翻译将写入记忆库：`)
  for (const { keyPath, srcText, translated, oldValue } of changes) {
    console.log(`  ${keyPath}`)
    console.log(`    源文:       "${srcText}"`)
    console.log(`    旧记忆库:   "${oldValue}"`)
    console.log(`    新值:       "${translated}"`)
  }

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

  for (const { keyPath, srcText, translated } of changes) {
    setMemory(memory, SOURCE_LANG, LANG, srcText, translated)
  }

  saveMemory(memory)
  console.log(`\n✅ 记忆库已更新 ${changes.length} 条`)

  console.log(`\n💡 提示：用 node scripts/translate.mjs --lock 锁定已确认的条目，防止被覆盖`)
  console.log(`      用 node scripts/translate.mjs --stats 查看记忆库统计`)
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
      const originalItem = items.find((i) => i.keyPath === key)
      if (originalItem) {
        setMemory(memory, SOURCE_LANG, LANG, originalItem.text, value)
      }
    }
  }

  console.log(`  ✅ ${section}: ${items.length} 个已翻译`)
}

saveMemory(memory)

fs.writeFileSync(TARGET_FILE, JSON.stringify(target, null, 2) + "\n")
console.log(`\n✅ 完成！已写入 ${LANG}.json（共 ${countKeys(target)} 个 key）`)
console.log(`💾 记忆库已更新: ${MEMORY_FILE}`)
console.log(`\n💡 提示：用 node scripts/translate.mjs --lock 锁定已确认的翻译，防止被覆盖`)
console.log(`      用 node scripts/translate.mjs --stats 查看记忆库统计`)