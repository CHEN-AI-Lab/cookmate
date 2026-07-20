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

**Consequences**: All UI text must be extracted from components into translation files. API error messages use locale-aware responses. Middleware detects browser language preference. Default locale is zh-CN.

---

## ADR-009: AI API timeout fallback + backup copy
**Date**: 2026-07-20
**Status**: Accepted

**Context**: Sensenova API takes ~20s to generate weekly meal plan, but Vercel Hobby plan has 10s function timeout. Users saw "Request timed out" errors.

**Decision**:
- `callAI` calls in `generateWeeklyPlan` and `generateRecipes` wrapped in try-catch
- On timeout/error, fall back to mock data (getMockWeeklyPlan / getMockRecipes)
- OpenAI client timeout reduced from 120s to 9s (Vercel 10s limit, 1s buffer)

**Backup**: A verified working copy of `shared/api/openai.ts` is stored at:
`backups/shared-api-openai/openai.ts`
See `backups/shared-api-openai/README.md` for details.

**Consequences**: Users see demo data instead of errors when AI API is slow or down. Real AI generation still works when API responds within 10s.