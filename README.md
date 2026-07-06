# CookMate — AI 智能食谱 & 餐食规划平台

## 概述

CookMate 是一款 AI 驱动的智能食谱推荐和餐食规划平台。用户输入冰箱里的食材，AI 自动推荐菜谱；支持周计划生成、购物清单、食材库管理等功能。

## 技术栈

- **框架**: Next.js 16 (App Router), TypeScript (strict mode)
- **样式**: Tailwind CSS v4 + shadcn/ui
- **数据库**: PostgreSQL (Neon) + Prisma ORM
- **认证**: NextAuth.js v5 (邮箱/手机验证码 + 密码 + Google/GitHub/支付宝/微信 OAuth)
- **AI**: OpenAI 兼容接口 (DeepSeek, SenseNova, OpenAI 等)
- **支付**: Stripe (国际) + PayJS (国内支付宝/微信)
- **部署**: Vercel
- **包管理**: pnpm monorepo

## 目录结构

```
cookmate/
├── apps/web/              # Next.js Web 应用
│   ├── src/
│   │   ├── app/           # App Router 页面 + API 路由
│   │   ├── components/    # UI 组件
│   │   └── lib/           # 仅 web 专用代码 (auth, prisma, providers)
│   ├── prisma/            # 数据库 schema
│   └── tests/             # 单元测试 + E2E 测试
├── shared/                # 跨平台共享代码
│   ├── api/               # API 客户端 (openai, alipay, stripe, payment)
│   ├── constants/         # 常量定义
│   ├── hooks/             # React hooks
│   ├── messages/          # 国际化翻译文件
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   └── validators/        # Zod 校验 schema
├── scripts/               # 项目脚本
│   ├── check-structure.sh # 结构合规检查
│   ├── check.sh           # 全量质量检查
│   ├── setup.sh           # 项目初始化
│   └── deploy.sh          # 部署
└── docs/                  # 文档
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 生成 Prisma Client
cd apps/web && npx prisma generate && cd ../..

# 复制环境变量（编辑填入实际配置）
cp .env.example .env

# 启动开发服务器
pnpm dev
```

## 环境变量

参见 `.env.example` 获取完整清单。关键配置：
- `DATABASE_URL` — PostgreSQL 连接串（推荐 Neon）
- `AUTH_SECRET` — NextAuth 密钥
- `AI_API_KEY` — AI 接口密钥（不配则使用演示数据）
- `STRIPE_SECRET_KEY` / `PAYJS_MCHID` — 支付配置

## 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm test` | 运行测试 |
| `bash scripts/check.sh` | 全量质量检查 |
| `bash scripts/check-structure.sh` | 结构合规检查 |

## 部署

1. 推送到 `preview` 分支 → Vercel 自动部署到预览环境
2. 测试通过后合并到 `main` → 自动部署到生产环境