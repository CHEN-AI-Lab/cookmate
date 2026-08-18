# 剩余 37 个警告修复计划

## 分类：共 19 个文件，31 个未使用变量 + 6 个 exhaustive-deps

---

### 批次 A — 简单删除（13 个文件，24 个变量）

| # | 文件 | 内容 | 操作 |
|---|------|------|------|
| A1 | `login-client.tsx` | `setPhone`, `setupCodeSent`, `sendCode`, `handlePhoneLogin` 4 个 `useState` 解构出来的 setter 未使用 | 删除 `const [phone, setPhone]` → `const [phone]`，其他同理 |
| A2 | `recipes/page.tsx` | `router` (L36) 未使用；`diffColor` (L287) 未使用 | 删除 `const router = useRouter()` 和 `diffColor` 变量 |
| A3 | `recipes/route.ts` | `getLocaleFromCookie`, `err` 导入未使用 | 删除 import 行 |
| A4 | `user/profile/route.ts` | `getLocaleFromCookie` 导入未使用 | 删除 import 行 |
| A5 | `grocery-list/route.ts` | `pantryNames` (L145) 赋值后未使用 | 删除 `const pantryNames` 行 |
| A6 | `stripe/webhook/route.ts` | `priceId` (L53) 赋值后未使用 | 删除 `const priceId` 行 |
| A7 | `meal-plan/route.ts` | `idx` (L165) 未使用 | 删除 `idx` 参数 |
| A8 | `settings/page.tsx` | `bindCountdown`, `setBindCountdown` (L52) 未使用 | 删除 `const [bindCountdown, setBindCountdown]` 行 |
| A9 | `billing/page.tsx` | `setMessage` (L43) 未使用 | 删除 `setMessage` 保留 `const [message]` |
| A10 | `MealPlanDetailModal.tsx` | `tc` (L46) 未使用 | 删除 `const tc = useTranslations("common")` 行 |
| A11 | `OnboardingWizard.tsx` | `router` (L20) 未使用 | 删除 `const router = useRouter()` 和 import |
| A12 | `PublicNavbar.tsx` | `link` (L15) 未使用 | 删除 `const link = ...` 行 |
| A13 | `alipay/notify/route.ts` | `tradeNo` (L14), `totalAmount` (L16) 未使用 | 删除这两行 |

### 批次 B — 组件级清理（3 个文件，9 个变量）

| # | 文件 | 内容 | 操作 |
|---|------|------|------|
| B1 | `grocery-list/page.tsx` | `GroceryCategoryList` 导入未使用；`tc` (L22) 未使用；`getCatLabel` (L25) 未使用 | 删除 unused import 和变量 |
| B2 | `meal-plan/page.tsx` | `MEAL_TYPES` (L34), `tr` (L40), `MEAL_EMOJIS` (L45) 未使用；`locale` 在 useEffect dep 缺失 | 删除 3 个变量；补充 locale 到 useEffect dep |
| B3 | `my-recipes/page.tsx` | `locale` 在 useEffect dep 缺失 (L127, L145) | 补充 locale 到 useEffect dep 数组 |

### 批次 C — exhaustive-deps 修复（3 个文件，4 个 deps）

| # | 文件 | 内容 | 操作 |
|---|------|------|------|
| C1 | `billing/page.tsx` | L90: useEffect 缺少 `t` | 补充 `t` 到 dep 数组 |
| C2 | `grocery-list/page.tsx` | L266: useCallback 缺少 `manualItems`；L268: useEffect 缺少 `loadData` | 补充 dep |
| C3 | `meal-plan/page.tsx` | L77: useEffect 缺少 `locale` | 补充 `locale` 到 dep 数组 |

---

## 执行顺序

```
批次 A (13个文件, 24个变量) → 跑 eslint 确认
批次 B (3个文件, 9个变量)   → 跑 eslint 确认
批次 C (3个文件, 4个 deps)  → 跑 eslint 确认
最终验证: bash scripts/check.sh
```

每批次完成后跑 `npx eslint . | grep error` 确认 0 errors。