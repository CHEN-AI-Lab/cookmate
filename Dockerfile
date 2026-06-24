# ============================================
# CookMate - Docker Multi-stage Build
# Next.js 16 + Prisma + PostgreSQL + Tailwind CSS v4
# ============================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies (Python for node-gyp, etc.)
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install production dependencies only for pruning
RUN npm ci

# Copy full source
COPY . .

# Generate Prisma client (needed for build)
RUN npx prisma generate

# Build Next.js application
RUN npm run build

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

# Copy Prisma schema and migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy built Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy package.json for scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Copy entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/scripts/entrypoint.sh ./scripts/entrypoint.sh
RUN chmod +x ./scripts/entrypoint.sh

# Copy .env.production (if present at build time)
COPY --from=builder --chown=nextjs:nodejs /app/.env.production* ./

# Expose application port
EXPOSE 3001

# Use dumb-init as the entrypoint for proper process management
ENTRYPOINT ["dumb-init", "--"]

# Run database migrations then start the application
CMD ["./scripts/entrypoint.sh"]
