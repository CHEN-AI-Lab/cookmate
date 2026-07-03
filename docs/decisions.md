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