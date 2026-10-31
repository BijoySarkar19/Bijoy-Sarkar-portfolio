# syntax=docker/dockerfile:1

# ── Stage 1: Dependencies ───────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ── Stage 2: Builder ────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="file:/app/data/dev.db"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_URL="https://bijoy-sarkar-portfolio.vercel.app"

# Ensure data directory exists for SQLite
RUN mkdir -p /app/data

# Generate Prisma Client
RUN npx prisma generate --config prisma7.config.ts

# Build the Next.js application
RUN npm run build

# ── Stage 3: Runner ─────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4173
ENV HOSTNAME="0.0.0.0"

# Install production utilities
RUN apk add --no-cache curl

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application assets and dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder /app/scripts ./scripts

# Ensure dev.db folder permissions for non-root user
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 4173

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4173/ || exit 1

CMD ["npm", "run", "start"]
