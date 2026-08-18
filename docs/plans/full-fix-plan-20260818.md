# 项目全面修复计划（2026-08-18）

## 问题清单

| # | 类型 | 严重度 | 描述 |
|---|------|--------|------|
| P1 | 测试 | ❌ | `shared/` 无任何单元测试，`pnpm test:shared` 报 "No test files found" 退出码 1 |
| P2 | 门禁 | ❌ | `scripts/check.sh` 的 Tests 只跑 apps/web，不跑 shared，掩盖 P1 |
| P3 | CI | ❌ | `.github/workflows/ci.yml` 同样只跑 `pnpm test`，不覆盖 shared |
| P4 | 门禁 | ⚠️ | `.husky/pre-commit` 缺少 `check-structure.sh` + 测试（铁律要求） |
| P5 | 交付 | ⚠️ | 40 个文件改动 + 3 个新增文件未提交 preview 分支 |

❌ 已排除的误报：Prisma 迁移存在（`prisma/migrations/0001_init/migration.sql`，根目录），迁移安全检查正常。

## 修复步骤

### Step 1: 创建 shared 测试骨架
- 创建 `shared/vitest.config.ts` — include `tests/unit/**/*.test.ts`
- 创建 `shared/tests/unit/` 目录

### Step 2: 编写 shared 单元测试（覆盖 4 个模块）

| 模块 | 文件 | 测试用例覆盖 |
|------|------|-------------|
| utils | `tests/unit/utils-index.test.ts` | cn, slugify, truncate, formatDate, formatDuration, getWeekDates, estimateCalories |
| utils | `tests/unit/order-id.test.ts` | generateOrderId 格式/前缀/去重 |
| utils | `tests/unit/locale.test.ts` | getLocaleFromCookie, e/t, err |
| utils | `tests/unit/login-rate-limit.test.ts` | 限流阈值、锁定期、成功解锁 |
| utils | `tests/unit/grocery-categories.test.ts` | classifyIngredient, isStaple, normalizeIngredientName, decomposeDishName |
| validators | `tests/unit/validators.test.ts` | 各 Zod schema 合法/非法输入、translateValidationError、translateZodErrors |
| constants | `tests/unit/constants.test.ts` | locales 集合、apiError 翻译、PRICING 结构完整性 |
| i18n | `tests/unit/i18n.test.ts` | 翻译 key 一致性（en/zh-CN/zh-TW/ja） |

### Step 3: 修改 `scripts/check.sh`
- Tests 项改为同时跑 `pnpm test` + `cd shared && npx vitest run`

### Step 4: 修改 `.github/workflows/ci.yml`
- 新增 `pnpm test:shared` 步骤

### Step 5: 补 `.husky/pre-commit`
- 在迁移检查后加 `bash scripts/check-structure.sh`（改动结构相关文件时）
- 加轻量测试门禁（shared 测试，避免每次提交全量跑）

### Step 6: 全量验证 + 提交
- `bash scripts/check.sh` 全部通过
- `pnpm build` 通过
- 提交全部改动到 preview 分支

## 验证标准
- `pnpm test:shared` 退出码 0，测试数 > 20
- `bash scripts/check.sh` 6/6 通过
- `pnpm build` 0 错误
- pre-commit 钩子可运行