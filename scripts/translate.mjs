/**
 * AI 翻译脚本 — 自动补翻译，支持翻译记忆库（锁定/解锁/备份/统计）
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
 *   node scripts/translate.mjs --check                         # 校验所有语言 key 一致
 *
 * 示例:
 *   node scripts/translate.mjs ja           # 英文→日语
 *   node scripts/translate.mjs zh-TW        # 简体中文→繁体中文（自动检测）
 *   node scripts/translate.mjs fr           # 英文→法语
 *   node scripts/translate.mjs zh-TW --learn  # 学习当前翻译文件中有 git 变动的 key
 *   node scripts/translate.mjs --lock         # 锁定已确认的翻译
 *   node scripts/translate.mjs --unlock       # 解锁条目
 *   node scripts/translate.mjs --show-locks   # 查看已锁定条目
 *   node scripts/translate.mjs --restore      # 从备份恢复
 *   node scripts/translate.mjs --stats        # 查看统计
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
 *   translation-memory.json.bak.2   ← 最近 2 次备份
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
const SRC_ARG = process.argv.indexOf("--source")
const SRC_LANG = SRC_ARG !== -1 ? process.argv[SRC_ARG + 1] : null

// 检查是否独立模式（不需要 <lang-code>）
const IS_STANDALONE = IS_CHECK || IS_LOCK || IS_UNLOCK || IS_SHOW_LOCKS || IS_RESTORE || IS_STATS

if (!LANG && !IS_STANDALONE) {
  console.error("用法: node scripts/translate.mjs <lang-code> [--source <src>] [--learn]")
  console.error("       node scripts/translate.mjs --check")
  console.error("       node scripts/translate.mjs --lock")
  console.error("       node scripts/translate.mjs --unlock")
  console.error("       node scripts/translate.mjs --show-locks")
  console.error("       node scripts/translate.mjs --restore")
  console.error("       node scripts/translate.mjs --stats")
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

    // 检查文件是否存在且可读
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
    // JSON 解析失败 → 报错提示，不清空记忆库
    console.error(`\n❌ 记忆库文件损坏或无法读取: ${MEMORY_FILE}`)
    console.error(`   错误: ${e.message}`)
    console.error(`\n💡 尝试用以下命令从备份恢复:`)
    console.error(`   node scripts/translate.mjs --restore\n`)
    process.exit(1)
  }
}

/**
 * 迁移旧格式 + 归一化所有 key
 * 旧格式: { "en→ja": { "egg": "卵" } }
 * 新格式: { "en→ja": { "locked": { "egg": "卵" }, "unlocked": {} } }
 */
function migrateMemory(memory) {
  let migrated = false
  let normalized = false

  for (const [langKey, entries] of Object.entries(memory)) {
    if (typeof entries !== "object" || entries === null) continue

    // 旧格式迁移：所有条目放入 unlocked
    if (entries.locked === undefined && entries.unlocked === undefined) {
      memory[langKey] = { locked: {}, unlocked: { ...entries } }
      migrated = true
    }

    // 归一化 locked 和 unlocked 中的 key
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
    saveMemory(memory, true) // 静默保存（不打印备份信息）
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

  // 轮转历史备份：.bak.4 → .bak.5, .bak.3 → .bak.4, ...
  for (let i = MAX_BACKUPS; i >= 2; i--) {
    const oldName = path.join(SHARED_DIR, `translation-memory.json.bak.${i - 1}`)
    const newName = path.join(SHARED_DIR, `translation-memory.json.bak.${i}`)
    if (fs.existsSync(oldName)) {
      fs.renameSync(oldName, newName)
    }
  }

  // 当前文件 → .bak.1
  fs.copyFileSync(MEMORY_FILE, path.join(SHARED_DIR, "translation-memory.json.bak.1"))

  // 同时更新 .bak 为最新备份（用于 --restore）
  fs.copyFileSync(MEMORY_FILE, BACKUP_FILE)
}

/**
 * 检查是否有并发写入
 */
function checkConcurrentModification() {
  if (memoryLoadedMtime === null) return true // 无法检查，继续

  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const currentMtime = fs.statSync(MEMORY_FILE).mtimeMs
      if (currentMtime > memoryLoadedMtime) {
        console.error("  ⚠️  警告：记忆库在加载后被外部修改！")
        console.error("     本次写入可能覆盖他人的变更")
        console.error("     建议先退出，用 --restore 检查或手动合并")
        return false // 有冲突
      }
    }
  } catch {
    // 忽略 stat 错误
  }
  return true // 无冲突
}

function saveMemory(memory, silent = false) {
  fs.mkdirSync(SHARED_DIR, { recursive: true })

  // 并发检测
  const safe = checkConcurrentModification()
  if (!safe && !silent) {
    // 继续保存，但警告已打印
  }

  // 备份（静默模式下不打印额外信息）
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

/**
 * 查找记忆库：先查 locked，再查 unlocked（key 已归一化）
 */
function lookupMemory(memory, sourceLang, targetLang, sourceText) {
  const langGroup = memory[getMemoryKey(sourceLang, targetLang)]
  if (!langGroup) return null
  const key = normalizeSource(sourceText)

  // 先查 locked
  if (langGroup.locked && langGroup.locked[key] !== undefined) {
    return langGroup.locked[key]
  }
  // 再查 unlocked
  if (langGroup.unlocked && langGroup.unlocked[key] !== undefined) {
    return langGroup.unlocked[key]
  }
  return null
}

/**
 * 写入记忆库（始终写入 unlocked，key 已归一化）
 * 如果条目已 locked，跳过不修改
 */
function setMemory(memory, sourceLang, targetLang, sourceText, translatedText) {
  const key = getMemoryKey(sourceLang, targetLang)
  if (!memory[key]) memory[key] = { locked: {}, unlocked: {} }

  const normalizedKey = normalizeSource(sourceText)

  // 已锁定 → 不修改
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

/**
 * 检查条目是否已锁定（key 已归一化）
 */
function isLocked(memory, sourceLang, targetLang, sourceText) {
  const langGroup = memory[getMemoryKey(sourceLang, targetLang)]
  if (!langGroup) return false
  const key = normalizeSource(sourceText)
  return langGroup.locked && langGroup.locked[key] !== undefined
}

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

    // 清理空的 unlocked
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

    // 清理空的 locked
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

// ===== --restore 模式：从备份恢复记忆库 =====
if (IS_RESTORE) {
  // 列出可用备份
  console.log("📋 可用备份：")
  const backups = []
  if (fs.existsSync(BACKUP_FILE)) {
    const stat = fs.statSync(BACKUP_FILE)
    const size = (stat.size / 1024).toFixed(1)
    backups.push({ file: BACKUP_FILE, label: "最新 (latest)", size })
    console.log(`  [1] 最新备份 (${size} KB)`)
  }
  for (let i = 1; i <= MAX_BACKUPS; i++) {
    const bakPath = path.join(SHARED_DIR, `translation-memory.json.bak.${i}`)
    if (fs.existsSync(bakPath)) {
      const stat = fs.statSync(bakPath)
      const size = (stat.size / 1024).toFixed(1)
      backups.push({ file: bakPath, label: `备份 #${i}`, size })
      console.log(`  [${backups.length}] 备份 #${i} (${size} KB)`)
    }
  }

  if (backups.length === 0) {
    console.error("❌ 没有找到任何备份文件")
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

  let restoreFile = BACKUP_FILE // 默认最新

  // 支持输入 .bak.3 直接指定版本号
  if (answer.startsWith(".bak") || answer.startsWith("bak")) {
    const verPath = answer.startsWith(".") ? path.join(SHARED_DIR, `translation-memory${answer}`) : path.join(SHARED_DIR, `translation-memory.${answer}`)
    if (fs.existsSync(verPath)) {
      restoreFile = verPath
    } else {
      console.error(`❌ 未找到备份: ${verPath}`)
      process.exit(1)
    }
  } else {
    const idx = parseInt(answer)
    if (!isNaN(idx) && idx >= 1 && idx <= backups.length) {
      restoreFile = backups[idx - 1].file
    } else {
      console.error("❌ 无效的备份编号")
      process.exit(1)
    }
  }

  // 确认恢复
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

  // 先备份当前记忆库
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

// ===== --stats 模式：显示记忆库统计 =====
if (IS_STATS) {
  const memory = loadMemory()
  let totalEntries = 0
  let totalLocked = 0
  let totalUnlocked = 0
  let langCount = 0

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

// ===== 以下为需要 <lang-code> 的模式 =====
// ─── 源语言自动检测 ───
// 中文繁体默认从简体中文翻译，其他语言从英文翻译
const SOURCE_LANG = SRC_LANG || (LANG === "zh-TW" ? "zh-CN" : "en")
const SOURCE_FILE = path.join(MESSAGES_DIR, `${SOURCE_LANG}.json`)
const TARGET_FILE = path.join(MESSAGES_DIR, `${LANG}.json`)

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

// ===== --learn 模式：学习翻译变动（跳过已锁定的条目） =====
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

  // 第一遍：收集所有变动，跳过已锁定的
  const changes = []
  const sourceFlat = flattenKeys(source)
  let skippedLocked = 0

  for (const { keyPath, value: srcText } of sourceFlat) {
    const translated = getNested(target, keyPath)
    if (translated === undefined || translated === null) continue

    // 跳过已锁定的条目（使用归一化 key 检测）
    if (isLocked(memory, SOURCE_LANG, LANG, srcText)) {
      skippedLocked++
      continue
    }

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

  // 第二遍：确认后写入记忆库（全部写入 unlocked）
  for (const { keyPath, srcText, translated } of changes) {
    setMemory(memory, SOURCE_LANG, LANG, srcText, translated)
  }

  saveMemory(memory)
  console.log(`\n✅ 记忆库已更新 ${changes.length} 条`)

  // 提示锁定
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
      // 同时写入记忆库（unlocked）
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
console.log(`\n💡 提示：用 node scripts/translate.mjs --lock 锁定已确认的翻译，防止被覆盖`)
console.log(`      用 node scripts/translate.mjs --stats 查看记忆库统计`)