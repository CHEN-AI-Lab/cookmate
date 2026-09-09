# CookMate Architecture Decision Records

## ADR-001: Use Next.js 14 App Router
**Date**: 2025-03-01
**Status**: Accepted

**Context**: Need modern React framework with SSR, auth, and API routes.

**Decision**: Use Next.js 14 App Router for file-based routing, server components, API routes, and middleware.

**Consequences**: Leverages RSC for performance, layout nesting for auth flows, and route groups for public/private sections.

---

## ADR-002: PostgreSQL + Prisma ORM
**Date**: 2025-03-01
**Status**: Accepted

**Context**: Need a relational database with migrations, type safety, and good DX.

**Decision**: Use PostgreSQL (Neon for production, SQLite via `file:./dev.db` for local dev) with Prisma ORM.

**Consequences**: Schema changes require Prisma migrations. SQLite local dev matches production schema.

---

## ADR-003: NextAuth.js v5 for Authentication
**Date**: 2025-03-01
**Status**: Accepted

**Context**: Need social login (Google) + email magic links + session management.

**Decision**: Use NextAuth.js v5 beta with Prisma adapter.

**Consequences**: Auth routes under `app/api/auth/[...nextauth]`. Session data obtained server-side via `auth()` helper.

---

## ADR-004: AI Provider Abstraction
**Date**: 2025-03-01
**Status**: Accepted

**Context**: AI provider may change during development (OpenAI → open-source alternatives).

**Decision**: Wrap all AI calls in `lib/openai.ts` with a provider-agnostic interface. API routes never call AI SDKs directly.

**Consequences**: Switching providers only requires updating `lib/openai.ts` and environment variables.

---

## ADR-005: Mobile-First Design
**Date**: 2025-03-01
**Status**: Accepted

**Context**: Majority of users access via mobile devices.

**Decision**: Design all layouts and components mobile-first using Tailwind CSS responsive utilities.

**Consequences**: Better mobile UX, progressive enhancement for desktop. More complexity in responsive layouts.

---

## ADR-006: Stripe + PayJS Dual Payment

> **[2026-09-02 已废弃 Superseded]**：Stripe 需要境外银行账户且未实际启用，已从代码中整体删除。当前支付渠道 = Creem（订阅）+ 支付宝（一次性付款）。保留本 ADR 作为历史决策记录。
**Date**: 2025-03-01
**Status**: Draft

**Context**: Need to accept payments internationally (Stripe) and domestically in China (PayJS for Alipay/WeChat).

**Decision**: Integrate both Stripe and PayJS behind a unified billing service layer.

**Consequences**: More complex payment handling but covers both markets. PayJS allows personal merchants.

---

## ADR-007: Monorepo with shared/ Package for Cross-Platform Code
**Date**: 2025-06-01
**Status**: Accepted

**Context**: Need to support multiple frontends (Web, potentially WeChat Mini Program, mobile app) while sharing types, constants, utils, validators, and i18n messages.

**Decision**: Use pnpm workspace monorepo with a `shared/` package (`@cookmate/shared`) containing all non-UI code. Each app (`apps/web/`) only contains UI rendering code and imports from `shared/`.

**Consequences**: Consistent types across platforms. Single source of truth for translations. Apps stay thin and focused on presentation.

---

## ADR-008: Internationalization (i18n) with next-intl
**Date**: 2025-06-01
**Status**: Draft

**Context**: Chinese and English users need native-language interfaces. All UI text is currently hardcoded in Chinese.

**Decision**: Use `next-intl` for i18n. Translation files live in `shared/messages/` (zh-CN.json, en.json). Locale routing via middleware. Language switcher in the UI header.

**Consequences**: All UI text must be extracted from components into translation files. API error messages use locale-aware responses. Middleware detects browser language preference. Default locale is `en`（本 ADR 撰写时规划为 zh-CN，实现时调整为 en，以 `shared/constants/locales.ts` 的 `defaultLocale` 为准；当前支持 en / zh-CN / zh-TW / ja 四种语言）。


---

## ADR-009: 营养分析（Phase 2）实现约定
**Date**: 2026-09-09
**Status**: Planned（未实现；占位页已存在于 `apps/web/src/app/[locale]/app/nutrition/page.tsx`）

**Context**: 营养分析为 Phase 2 功能。2026-09-09 评估结论：AI 生成菜谱时已要求返回每道菜卡路里（`Recipe.calories` 已存在），蛋白质/脂肪/碳水只需扩展 AI prompt 的 JSON schema；**不接第三方食物数据库**（Edamam/FatSecret 等均收费），全部营养值由 AI 估算，零额外 API 成本。

**Decision**:
1. 实现内容：`nutrition_logs` 表（user_id / date / calories / protein / fat / carbs）+ 3 个接口（`/api/nutrition/daily`、`/api/nutrition/log`、`/api/nutrition/stats`）+ 前端页面（今日摄入卡片 + 周/月统计图表）。
2. **页面必须可见地标注「营养数据为 AI 估算，仅供参考」**——服务条款（`terms.aiDesc` / `terms.disclaimer`）已有对应免责声明，前端页面同样要有可见标注；文案进 `shared/messages/` 四语言（zh-CN / en 手写，zh-TW / ja 走翻译脚本）。
3. 不引入图表库（图表手写 SVG 或届时再评估），不新增任何付费 API、无额外支出。

**Consequences**: 实现成本低（约 1-2 天：1 次迁移 + 3 接口 + 1 页面）；AI 估算值为近似值，UI 标注与服务条款口径一致，避免合规风险。