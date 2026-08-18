# 检查修复计划

## 发现问题清单

| # | 类型 | 严重度 | 描述 |
|---|------|--------|------|
| 1 | 结构 | ❌ | `apps/web/src/lib/login-rate-limit.ts` 应移至 `shared/utils/` |
| 2 | Lint error | ❌ | `Sidebar.tsx:104` — useEffect 内同步 setState (toast) |
| 3 | Lint error | ❌ | `Sidebar.tsx:124` — useEffect 内同步 setState (langOpen) |
| 4 | Lint error | ❌ | `LanguageSwitcher.tsx:25` — useEffect 内同步 setState (toast) |
| 5 | 翻译 | ❌ | `onboarding.step4` 在 `en.json` 和 `ja.json` 缺失 |
| 6 | Lint警告 | ⚠️ | 55 个未使用变量/import 警告，分布在 20+ 文件 |

---

## 修复方案

### 1. 结构修复：移动 `login-rate-limit.ts` 到 `shared/utils/`

**原因**: 该文件是纯内存限流器，无 `next/*` 依赖、无 `'use client'`，属于通用工具。

**步骤**:
1. 创建 `shared/utils/login-rate-limit.ts` — 内容与原文件完全一致
2. 删除 `apps/web/src/lib/login-rate-limit.ts`
3. 更新 `apps/web/src/lib/auth.ts` 中的 import:
   - `import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/login-rate-limit"`
   - → `import { checkLoginRateLimit, recordLoginAttempt } from "@cookmate/shared/utils/login-rate-limit"`
4. 更新 `apps/web/src/app/api/auth/check-lockout/route.ts` 中的 import:
   - `import { checkLoginRateLimit } from "@/lib/login-rate-limit"`
   - → `import { checkLoginRateLimit } from "@cookmate/shared/utils/login-rate-limit"`

### 2. 修复 Lint Error: `Sidebar.tsx:104` — toast sessionStorage

**原因**: `useEffect` 中同步读 `sessionStorage` 后调 `setDemoLangToast`，触发级联渲染。

**方案**: 用 lazy initial state 替代 useEffect 读取，在 useEffect 中只处理定时器：
```tsx
// 原始
const [demoLangToast, setDemoLangToast] = useState("")
useEffect(() => {
  const saved = sessionStorage.getItem("demoLangToast")
  if (saved) {
    setDemoLangToast(saved)
    sessionStorage.removeItem("demoLangToast")
    const timer = setTimeout(() => setDemoLangToast(""), 2500)
    return () => clearTimeout(timer)
  }
}, [])

// 修复后
const [demoLangToast, setDemoLangToast] = useState(() => {
  if (typeof window === "undefined") return ""
  const saved = sessionStorage.getItem("demoLangToast")
  if (saved) {
    sessionStorage.removeItem("demoLangToast")
    return saved
  }
  return ""
})
useEffect(() => {
  if (!demoLangToast) return
  const timer = setTimeout(() => setDemoLangToast(""), 2500)
  return () => clearTimeout(timer)
}, [demoLangToast])
```

### 3. 修复 Lint Error: `Sidebar.tsx:124` — 菜单关闭时重置子菜单

**原因**: `useEffect` 依赖 `open` 变化时同步调 `setLangOpen(false)`。

**方案**: 在 `setOpen(false)` 的地方直接同时设置 `setLangOpen(false)`，移除 useEffect。

文件中有两处 `setOpen(false)`:
- 点击外部关闭（line 114-115 handleClick）
- ~~点击语言切换时的处理~~（需要确认）

需要确认 Sidebar 中所有 `setOpen(false)` 的位置，确保在每个地方同步调用 `setLangOpen(false)`。

### 4. 修复 Lint Error: `LanguageSwitcher.tsx:25` — toast sessionStorage

**原因**: 同 Sidebar.tsx，useEffect 中同步读 sessionStorage 后调 setToast。

**方案**: 同方案 2，用 lazy initial state。

### 5. 翻译修复：补 `onboarding.step4`

**需要**: 在 `en.json` 和 `ja.json` 的 onboarding 节补 `step4`。

`zh-CN.json` 中: `"step4": "食材库"`
`en.json` 中 → `"step4": "Pantry"` (按 step1=AI Recipes, step2=Meal Plan, step3=Pantry 的英文对应关系)
`ja.json` 中 → `"step4": "食材庫"` (ja.json 已有 step3="食材庫"，step4 也是 "食材庫")

补在 `en.json` onboarding 中 `step3` 之后、`welcomeTitle` 之前的位置。
补在 `ja.json` onboarding 中 `step3` 之后、`dietType` 之前的位置。

### 6. Lint 警告清理（55 个未使用变量）— 分批次处理

**策略**: 按文件分组，批量移除未使用的 import/变量。分为 3 个子批次：

| 批次 | 文件 | 数量 |
|------|------|------|
| A | 登录/注册相关文件 | ~10 |
| B | 购物清单/食材库相关文件 | ~15 |
| C | 其他（仪表盘、周计划、支付等） | ~30 |

**注意**: 只移除明确未使用的 import/变量，不改变任何逻辑。对 `exhaustive-deps` 警告按需补充依赖数组。

---

## 执行顺序

```
1. 结构修复: login-rate-limit 迁移
2. Lint error 修复: Sidebar.tsx (2个)
3. Lint error 修复: LanguageSwitcher.tsx (1个)
4. 翻译修复: en.json + ja.json 补 step4
5. Lint 警告: 批次 A
6. Lint 警告: 批次 B
7. Lint 警告: 批次 C
8. 最终验证: 跑 bash scripts/check.sh
```

每个步骤执行后均跑 `pnpm lint` 确认无新增错误。