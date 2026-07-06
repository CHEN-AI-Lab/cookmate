# CookMate — AI 智能食谱 & 餐食规划平台

## 技术栈

- **框架**: Next.js 16 (App Router), TypeScript (strict mode)
- **样式**: Tailwind CSS v4
- **数据库**: PostgreSQL (Neon) + Prisma ORM
- **认证**: NextAuth.js v5
- **AI**: OpenAI 兼容接口
- **支付**: Stripe + PayJS
- **部署**: Vercel
- **包管理**: pnpm monorepo

## 目录结构

```
cookmate/
├── apps/web/              # Next.js Web 应用
│   ├── src/
│   │   ├── app/           # App Router 页面 + API 路由
│   │   │   ├── (auth)/    # 登录/注册页面
│   │   │   ├── (public)/  # 公开页面（首页、定价、博客）
│   │   │   ├── app/       # 登录后页面（仪表盘、菜谱、购物清单等）
│   │   │   └── api/       # API 路由（auth, payment, recipes, meal-plan 等）
│   │   ├── components/    # UI 组件（layout, features, ui）
│   │   └── lib/           # Web 专用代码（auth, prisma, providers）
│   ├── prisma/            # Prisma schema
│   └── tests/             # 测试
├── shared/                # 跨平台共享代码
│   ├── api/               # API 客户端（openai, alipay, stripe, payment）
│   ├── constants/         # 常量
│   ├── hooks/             # React hooks
│   ├── messages/          # 国际化
│   ├── types/             # 类型定义
│   ├── utils/             # 工具函数
│   └── validators/        # Zod 校验
├── scripts/               # 项目脚本
└── docs/                  # 文档
```

## 关键规则（AI Agent 工作指南）

1. **AI 生成食谱是核心价值** — 所有功能围绕 "让用户3秒决定吃什么" 展开
2. **移动端优先** — 大部分用户在手机上使用
3. **免费版足够有用** — 免费用户每天1次AI推荐，做口碑传播
4. **数据库模型变更必须先写Prisma schema再推代码**
5. **API routes 放在 app/api/ 下，按功能模块分目录**
6. **所有外部 API key 通过环境变量注入，不上传**
7. **通用代码必须放 shared/，不放在 apps/web/src/lib/ 下**
8. **修改前先诊断，诊断完必须修复**

## 日常命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建
pnpm test         # 运行测试
bash scripts/check.sh  # 全量质量检查
```

## 架构约束

- 依赖方向: UI → Components → API → Lib/Prisma (单向)
- AI 调用封装在 shared/api/openai.ts，API route 不直接调用 OpenAI SDK
- 所有 Stripe 操作走 webhook，不从前端直接处理支付逻辑
- 用户数据只通过 session 获取 userId，禁止从前端传 userId