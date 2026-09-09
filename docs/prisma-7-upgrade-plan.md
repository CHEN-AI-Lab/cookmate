# Prisma 6 → 7 升级计划

> 状态：待执行 | 创建时间：2026-08-18 | 当前版本：Prisma 6.19.3 | 目标版本：7.9.1

## 背景

用户 2026-08 要求所有项目必须用 Prisma 最新版本。cookmate 已从 5 升到 6，还需升到 7。Prisma 7 完全支持 Vercel 部署（官方有专用指南），不是兼容性问题，只是改动量大需要专门安排时间。

## 现状盘点（已查实）

| 文件 | 现状 |
|------|------|
| `prisma/schema.prisma` | `prisma-client-js` provider + `datasource` 里 url/directUrl |
| `apps/web/src/lib/prisma.ts` | `new PrismaClient()` 无参（7 禁止） |
| `apps/web/src/lib/auth.ts` | `import { PrismaAdapter } from "@auth/prisma-adapter"` |
| `scripts/check-passwords.ts` | `@prisma/client` 导入 |
| `apps/web/scripts/check-users.ts` | `@prisma/client` 导入 |
| `apps/web/scripts/check-passwords.ts` | `@prisma/client` 导入 |
| `apps/web/vercel.json` | buildCommand 用 `--schema=../../prisma/schema.prisma` |
| tsconfig | module: esnext + moduleResolution: bundler（已接近 ESM） |

## 改动步骤（按顺序，每步验证）

### Step 1 — schema 改造

```
prisma/schema.prisma:
  provider = "prisma-client-js"   →   provider = "prisma-client"
  新增必填: output = "../apps/web/src/generated/prisma"
  datasource 块: 移除 url/directUrl（7 里弃用）
```

### Step 2 — 新增 prisma.config.ts（放仓库根目录）

```
加载 dotenv 环境变量
datasource.url = env("DATABASE_URL")
schema = "prisma/schema.prisma"
```

### Step 3 — 安装 adapter

```
pnpm add @prisma/adapter-pg（apps/web）
prisma + @prisma/client → 7.9.1（root + apps/web 同步）
```

### Step 4 — 改 5 个文件 import 路径

| 文件 | 改动 |
|------|------|
| `apps/web/src/lib/prisma.ts` | `new PrismaClient({ adapter: new PrismaPg({...}) })` |
| `apps/web/src/lib/auth.ts` | import 改 `./generated/prisma/client` |
| `scripts/check-passwords.ts` | import 改 generated 路径 |
| `apps/web/scripts/check-users.ts` | import 改 generated 路径 |
| `apps/web/scripts/check-passwords.ts` | import 改 generated 路径 |

### Step 5 — ESM 迁移（最大风险点）

```
apps/web/package.json 加 "type": "module"
→ 影响：next.config.ts、proxy.ts、vitest.config.ts、postcss 等
→ Next.js 16 原生支持 ESM，但要逐个验证
```

### Step 6 — 部署配置

```
vercel.json buildCommand:
  --schema=... 参数删掉（prisma.config.ts 已指定）
  加 dotenv 加载（Prisma 7 CLI 不自动读 env）
```

### Step 7 — 验证（每步都跑）

```
npx prisma validate → tsc --noEmit → pnpm test(137) → pnpm build → check.sh
Vercel preview 部署实测（SSL、连接池、env 加载）
```

## 风险点

1. **ESM 迁移影响面最大** — 整个 apps/web 从 CJS 变 ESM，vitest/playwright/next.config 都要确认兼容
2. **`@auth/prisma-adapter v2.11`** — 需确认支持 Prisma 7 generated client（要实测 auth 登录流程）
3. **Neon SSL** — 上线后可能要 `rejectUnauthorized: false`
4. **3 个脚本**是独立 Node 脚本，ESM 后 `import` 语法和运行方式要验证

## 估时

顺利半天，卡在 ESM 的话可能一天。
