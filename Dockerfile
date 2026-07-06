# ============================================
# CookMate - Docker Multi-stage Build
# Next.js 16 + Prisma + PostgreSQL + Tailwind CSS v4
# ============================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Install build dependencies (Python for node-gyp, etc.)
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY shared/package.json ./shared/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Generate Prisma client
RUN cd apps/web && npx prisma generate

# Build Next.js application
RUN pnpm build

# ---- Stage 2: Production Runtime ----
FROM node:22-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl netcat-openbsd

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy production node_modules from builder
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./apps/web/prisma

# Copy built Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.ts ./apps/web/next.config.ts

# Copy entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Copy .env.production (if present at build time)
COPY --from=builder --chown=nextjs:nodejs /app/.env.production* ./

# Expose application port
EXPOSE 3000

# Use dumb-init as the entrypoint for proper process management
ENTRYPOINT ["dumb-init", "--"]

# Run database migrations then start the application
CMD ["./scripts/docker-entrypoint.sh"]