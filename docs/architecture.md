# CookMate Architecture Overview

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: NextAuth.js v5 (Google + Email/magic link)
- **AI**: OpenAI GPT-4o (via `lib/openai.ts`)
- **Payment**: Stripe + PayJS (China)
- **Deploy**: Vercel
- **Domain**: cookmate.ai

## Architecture Layers (dependency direction: top → bottom)
```
Pages (app/)          ← Page components, layouts
Components            ← Shared UI components (ui/, layout/, features/)
API Routes (app/api/) ← Server endpoints
Services (lib/)       ← Business logic
Prisma (prisma/)      ← ORM + Database schema
Shared (shared/)      ← Types, constants, validators, utils, api, hooks
```

## Directory Structure
```
cookmate/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public pages
│   │   ├── page.tsx        # Landing / hero
│   │   ├── pricing/        # Pricing page
│   │   ├── about/          # About
│   │   └── blog/           # Blog
│   ├── (auth)/             # Auth pages
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── app/                # Authenticated pages
│   │   ├── dashboard/
│   │   ├── recipes/
│   │   ├── my-recipes/
│   │   ├── meal-plan/
│   │   ├── grocery-list/
│   │   ├── pantry/
│   │   ├── settings/
│   │   ├── billing/
│   │   └── onboarding-preview/
│   └── api/                # API routes by domain
├── components/             # UI components
│   ├── ui/                 # shadcn/ui base
│   ├── layout/             # Layout components
│   └── features/           # Feature-specific
├── lib/                    # Utilities & services
│   ├── auth.ts             # NextAuth config
│   ├── openai.ts           # AI provider wrapper
│   ├── prisma.ts           # Prisma client
│   ├── stripe.ts           # Stripe wrapper
│   └── utils.ts            # Helpers
├── prisma/                 # Database schema & migrations
├── shared/                 # Cross-platform code
│   ├── types/              # TypeScript types
│   ├── constants/          # App constants
│   ├── validators/         # Zod schemas
│   ├── utils/              # Pure utilities
│   ├── api/                # API client
│   └── hooks/              # React hooks
└── docs/                   # Project documentation
```

## Key Design Decisions

### 1. Mobile-First UI
Most users are on mobile. All layouts and components are designed mobile-first with tablet/desktop progressive enhancement.

### 2. AI Recipe Generation
AI calls are wrapped in `lib/openai.ts` with provider-agnostic interface. API routes never call AI SDKs directly. This allows switching between OpenAI, DeepSeek, or other providers by changing environment variables.

### 3. Free Tier Strategy
Free users get 1 AI recommendation/day. This drives word-of-mouth growth while providing clear upgrade motivation.

### 4. Payment Flexibility
Stripe handles international payments; PayJS handles domestic (China) Alipay/WeChat payments. Both are abstracted behind a unified billing interface.

### 5. Database Safety
All schema changes must go through Prisma migrations. No raw SQL. Environment variables determine database URL (SQLite for local dev, PostgreSQL for production).

## Data Flow
1. User describes meal preference → Frontend validates + POST /api/recipes/generate
2. Server calls AI via `lib/openai.ts` → Parses structured recipe → Stores in DB
3. Recipe added to user's meal plan or saved to my-recipes
4. Meal plan generates grocery list from all recipes in the week
5. Pantry inventory helps optimize grocery suggestions (don't buy what you already have)