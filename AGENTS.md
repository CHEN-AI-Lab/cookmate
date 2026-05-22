# CookMate — AI 智能食谱 & 餐食规划平台

## 技术栈

- **框架**: Next.js 14 (App Router), TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: PostgreSQL (Neon) + Prisma ORM
- **认证**: NextAuth.js (Google + Email)
- **AI**: OpenAI GPT-4o
- **支付**: Stripe
- **部署**: Vercel

## 目录结构

```
cookmate/
├── app/                    # Next.js App Router
│   ├── (public)/           # 公开页面
│   │   ├── page.tsx        # 首页
│   │   ├── pricing/        # 定价页
│   │   ├── about/          # 关于
│   │   └── blog/           # 博客
│   ├── (auth)/             # 认证页面
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── app/                # 登录后页面
│   │   ├── dashboard/      # 主面板
│   │   ├── recipes/        # AI 食谱生成
│   │   ├── meal-plan/      # 周计划
│   │   ├── grocery-list/   # 购物清单
│   │   ├── pantry/         # 食材管理
│   │   ├── settings/       # 账户设置
│   │   └── billing/        # 账单
│   └── api/                # API routes
│       ├── auth/
│       ├── recipes/
│       ├── meal-plans/
│       ├── grocery-lists/
│       ├── pantry/
│       └── stripe/
├── components/             # 共享组件
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── layout/             # 布局组件
│   └── features/           # 功能组件
├── lib/                    # 工具函数
│   ├── prisma.ts
│   ├── openai.ts
│   ├── stripe.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── docs/                   # 文档
│   ├── product-specs/
│   ├── design-docs/
│   └── references/
├── public/                 # 静态资源
└── AGENTS.md
```

## 关键规则

1. **AI 生成食谱是核心价值** — 所有功能围绕 "让用户3秒决定吃什么" 展开
2. **移动端优先** — 大部分用户在手机上使用
3. **免费版足够有用** — 免费用户每天1次AI推荐，做口碑传播
4. **数据库模型变更必须先写Prisma schema再推代码**
5. API routes 放在 app/api/ 下，按功能模块分目录
6. 所有外部 API key 通过环境变量注入，不上传

## 架构约束

- 依赖方向: UI → Components → API → Lib/Prisma (单向)
- AI 调用封装在 lib/openai.ts，API route 不直接调用 OpenAI SDK
- 所有 Stripe 操作走 webhook，不从前端直接处理支付逻辑
- 用户数据只通过 session 获取 userId，禁止从前端传 userId